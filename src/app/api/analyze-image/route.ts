import { NextRequest, NextResponse } from 'next/server';

// Azure Vision API configuration - ALL from environment variables
const AZURE_ENDPOINT = process.env.AZURE_VISION_ENDPOINT;
const AZURE_SUBSCRIPTION_KEY = process.env.AZURE_VISION_SUBSCRIPTION_KEY;

if (!AZURE_ENDPOINT || !AZURE_SUBSCRIPTION_KEY) {
  throw new Error('Azure Vision environment variables are required: AZURE_VISION_ENDPOINT and AZURE_VISION_SUBSCRIPTION_KEY');
}

// Map Vision tags → Held categories
const TAG_TO_CATEGORY: Record<string, string> = {
  "speaker": "Audio",
  "headphones": "Audio", 
  "turntable": "Audio",
  "amplifier": "Audio",
  "camera": "Photography",
  "lens": "Photography",
  "photography": "Photography",
  "dslr": "Photography",
  "mirrorless": "Photography",
  "film camera": "Photography",
  "digital camera": "Photography",
  "bicycle": "Bicycles",
  "chair": "Furniture",
  "sofa": "Furniture",
  "watch": "Watches",
  "shoe": "Apparel",
  "bag": "Apparel",
  "record": "Media",
  "vinyl": "Media",
};

// Map Azure Vision categories → Held categories
const CATEGORY_MAPPING: Record<string, string> = {
  "animal_cat": "Art",
  "animal_dog": "Art", 
  "animal_bird": "Art",
  "text_sign": "Art",
  "text_document": "Art",
  "outdoor_landscape": "Art",
  "outdoor_nature": "Art",
  "indoor_room": "Furniture",
  "indoor_kitchen": "Furniture",
  "indoor_bedroom": "Furniture",
  "people_portrait": "Art",
  "people_group": "Art",
  "trans_car": "Automotive",
  "trans_truck": "Automotive",
  "trans_motorcycle": "Automotive",
  "trans_bicycle": "Bicycles",
  "trans_bus": "Automotive",
  "trans_train": "Automotive",
  "trans_airplane": "Automotive",
  "trans_boat": "Automotive",
};

async function analyzeImage(imageUrl: string) {
  // Ensure endpoint ends with slash for proper URL joining
  const endpoint = AZURE_ENDPOINT!.endsWith('/') ? AZURE_ENDPOINT! : AZURE_ENDPOINT! + '/';
  const analyzeUrl = `${endpoint}vision/v3.2/analyze`;
  const params = new URLSearchParams({
    visualFeatures: "Categories,Description,Brands"
  });

  // Check if it's a data URL (base64 encoded image)
  if (imageUrl.startsWith('data:image/')) {
    // Extract base64 data from data URL
    const base64Data = imageUrl.split(',')[1];
    
    if (!base64Data) {
      throw new Error('Invalid data URL: no base64 data found');
    }
    
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Check if image is too small (Azure requires at least 50x50 pixels)
    if (imageBuffer.length < 1000) { // Rough heuristic for very small images
      throw new Error('Image too small for analysis');
    }
    
    const headers = {
      "Ocp-Apim-Subscription-Key": AZURE_SUBSCRIPTION_KEY!,
      "Content-Type": "application/octet-stream"
    };

    const response = await fetch(`${analyzeUrl}?${params}`, {
      method: 'POST',
      headers,
      body: imageBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Vision API binary error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Binary upload failed: ${response.status}`);
    }

    return response.json();
  } else {
    // Handle regular HTTP URLs
    const headers = {
      "Ocp-Apim-Subscription-Key": AZURE_SUBSCRIPTION_KEY!,
      "Content-Type": "application/json"
    };

    const response = await fetch(`${analyzeUrl}?${params}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: imageUrl })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Vision API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url: analyzeUrl
      });
      throw new Error(`Azure Vision API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}

function extractBrandCategory(data: any) {
  console.log('🔍 Azure Vision Raw Response:', JSON.stringify(data, null, 2));
  
  // Extract brand
  let brand = null;
  let brandConfidence = null;
  const brands = data.brands || [];
  if (brands.length > 0) {
    const topBrand = brands.reduce((max: any, current: any) => 
      (current.confidence || 0) > (max.confidence || 0) ? current : max
    );
    if (topBrand.confidence >= 0.6) {
      brand = topBrand.name;
      brandConfidence = topBrand.confidence;
    }
  }

  // Extract category
  let category = null;
  let categoryConfidence = null;
  const categories = data.categories || [];
  const sortedCategories = categories.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
  
  console.log('📊 Categories found:', sortedCategories.map((c: any) => ({ name: c.name, score: c.score })));
  
  // First, check if we have a direct category mapping
  if (sortedCategories.length > 0) {
    const bestCategory = sortedCategories[0];
    const categoryName = bestCategory.name;
    
    // Check if we have a direct mapping for this category
    if (CATEGORY_MAPPING[categoryName]) {
      console.log(`✅ Found direct category mapping: ${categoryName} → ${CATEGORY_MAPPING[categoryName]}`);
      category = CATEGORY_MAPPING[categoryName];
      categoryConfidence = bestCategory.score;
    } else {
      // Fallback to formatted category name
      const name = (categoryName || "").replace(/_/g, " ").trim();
      if (name && name.toLowerCase() !== "others") {
        category = name.split(' ').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        categoryConfidence = bestCategory.score;
      }
    }
  }

  // Check tags for better category mapping (tags often more accurate for specific objects)
  const tags = data.description?.tags || [];
  console.log('🏷️ Tags found:', tags);
  
  for (const tag of tags) {
    if (TAG_TO_CATEGORY[tag]) {
      console.log(`✅ Found better tag-based mapping: ${tag} → ${TAG_TO_CATEGORY[tag]}`);
      category = TAG_TO_CATEGORY[tag];
      categoryConfidence = 0.85; // Higher confidence for tag-based mapping
      break;
    }
  }

  const result = {
    brand,
    brandConfidence,
    category,
    categoryConfidence,
    raw: data,
    debug: {
      categories: sortedCategories,
      tags: tags,
      tagMappings: tags.map((tag: string) => ({ tag, mappedCategory: TAG_TO_CATEGORY[tag] }))
    }
  };
  
  console.log('🎯 Final result:', result);
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Validate image URL format
    if (!imageUrl.startsWith('data:image/') && !imageUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting image analysis for:', imageUrl.substring(0, 100) + '...');

    // Analyze the image with Azure Vision
    const analysisData = await analyzeImage(imageUrl);
    
    // Extract brand and category information
    const result = extractBrandCategory(analysisData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error analyzing image:', error);
    
    // Handle specific Azure Vision API errors
    if (error instanceof Error) {
      if (error.message.includes('Azure Vision API error')) {
        return NextResponse.json(
          { error: 'Azure Vision service temporarily unavailable' },
          { status: 503 }
        );
      }
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Image analysis timed out' },
          { status: 408 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    );
  }
}
