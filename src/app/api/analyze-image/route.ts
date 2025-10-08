import { NextRequest, NextResponse } from 'next/server';

// Map Vision tags → Held categories
const TAG_TO_CATEGORY: Record<string, string> = {
  // Audio/HiFi
  "speaker": "HiFi",
  "headphones": "HiFi", 
  "turntable": "HiFi",
  "amplifier": "HiFi",
  "stereo": "HiFi",
  "audio": "HiFi",
  "sound": "HiFi",
  "music": "Music",
  "vinyl": "Music",
  "record": "Music",
  "cd": "Music",
  "tape": "Music",
  
  // Photography (high priority - very specific)
  "camera": "Photography",
  "lens": "Photography",
  "photography": "Photography",
  "dslr": "Photography",
  "mirrorless": "Photography",
  "film camera": "Photography",
  "digital camera": "Photography",
  "photo": "Photography",
  "picture": "Photography",
  "photographic": "Photography",
  "camera equipment": "Photography",
  "camera gear": "Photography",
  
  // Transportation
  "bicycle": "Bicycle",
  "bike": "Bicycle",
  "car": "Auto",
  "automobile": "Auto",
  "vehicle": "Auto",
  "motorcycle": "Moto",
  "moto": "Moto",
  "scooter": "Moto",
  
  // Furniture
  "chair": "Furniture",
  "sofa": "Furniture",
  "table": "Furniture",
  "desk": "Furniture",
  "bed": "Furniture",
  "lamp": "Lighting",
  "light": "Lighting",
  "lighting": "Lighting",
  
  // Timepieces
  "watch": "Timepieces",
  "clock": "Timepieces",
  "timepiece": "Timepieces",
  "wristwatch": "Timepieces",
  
  // Fashion
  "shoe": "Fashion",
  "shoes": "Fashion",
  "bag": "Fashion",
  "handbag": "Fashion",
  "purse": "Fashion",
  "clothing": "Fashion",
  "dress": "Fashion",
  "shirt": "Fashion",
  "jacket": "Fashion",
  "hat": "Fashion",
  "jewelry": "Fashion",
  "ring": "Fashion",
  "necklace": "Fashion",
  "bracelet": "Fashion",
  
  // Tech
  "computer": "Tech",
  "laptop": "Tech",
  "phone": "Tech",
  "smartphone": "Tech",
  "tablet": "Tech",
  "monitor": "Tech",
  "keyboard": "Tech",
  "mouse": "Tech",
  "gaming": "Tech",
  "console": "Tech",
  "vr": "Tech",
  "headset": "Tech",
  "electronic": "Tech",
  "device": "Tech",
  "gadget": "Tech",
  
  // Art
  "painting": "Art",
  "art": "Art",
  "sculpture": "Art",
  "drawing": "Art",
  "sketch": "Art",
  "canvas": "Art",
  "portrait": "Art",
  "landscape": "Art",
  "abstract": "Art",
  "picture frame": "Art",
  "frame": "Art",
  "gallery": "Art",
  "museum": "Art",
  "artwork": "Art",
  "print": "Art",
  "poster": "Art",
  
  // Books
  "book": "Books",
  "books": "Books",
  "magazine": "Books",
  "newspaper": "Books",
  "text": "Books",
  "reading": "Books",
  
  // Instruments
  "guitar": "Instruments",
  "piano": "Instruments",
  "violin": "Instruments",
  "drum": "Instruments",
  "instrument": "Instruments",
  "music instrument": "Instruments",
  
  // Industrial Design
  "tool": "Industrial Design",
  "tools": "Industrial Design",
  "machine": "Industrial Design",
  "equipment": "Industrial Design",
  "appliance": "Industrial Design",
  
  // Everyday Carry
  "knife": "Everyday Carry",
  "pen": "Everyday Carry",
  "pencil": "Everyday Carry",
  "notebook": "Everyday Carry",
  "wallet": "Everyday Carry",
  "keys": "Everyday Carry",
  
  // Ephemera
  "paper": "Ephemera",
  "document": "Ephemera",
  "ticket": "Ephemera",
  "postcard": "Ephemera",
  "stamp": "Ephemera",
  "vintage": "Vintage",
  "antique": "Vintage",
  "old": "Vintage",
  "retro": "Vintage"
};

// Map Azure Vision categories → Held categories
const CATEGORY_MAPPING: Record<string, string> = {
  // Animals (often in art context)
  "animal_cat": "Art",
  "animal_dog": "Art", 
  "animal_bird": "Art",
  "animal_horse": "Art",
  "animal_fish": "Art",
  
  // Text and documents
  "text_sign": "Art",
  "text_document": "Books",
  "text_book": "Books",
  "text_magazine": "Books",
  "text_newspaper": "Books",
  
  // Outdoor scenes
  "outdoor_landscape": "Art",
  "outdoor_nature": "Art",
  "outdoor_forest": "Art",
  "outdoor_mountain": "Art",
  "outdoor_beach": "Art",
  "outdoor_city": "Art",
  
  // Indoor scenes
  "indoor_room": "Furniture",
  "indoor_kitchen": "Furniture",
  "indoor_bedroom": "Furniture",
  "indoor_living_room": "Furniture",
  "indoor_office": "Tech",
  "indoor_studio": "Art",
  
  // People
  "people_portrait": "Art",
  "people_group": "Art",
  "people_selfie": "Art",
  "people_family": "Art",
  
  // Transportation
  "trans_car": "Auto",
  "trans_truck": "Auto",
  "trans_motorcycle": "Moto",
  "trans_bicycle": "Bicycle",
  "trans_bus": "Auto",
  "trans_train": "Auto",
  "trans_airplane": "Auto",
  "trans_boat": "Auto",
  "trans_helicopter": "Auto",
  
  // Abstract and art
  "abstract_rect": "Art",
  "abstract": "Art",
  "abstract_nature": "Art",
  "abstract_other": "Art",
  "abstract_geometric": "Art",
  "abstract_colorful": "Art",
  
  // Objects and items
  "object_furniture": "Furniture",
  "object_electronics": "Tech",
  "object_clothing": "Fashion",
  "object_jewelry": "Fashion",
  "object_tool": "Industrial Design",
  "object_kitchen": "Furniture",
  "object_bathroom": "Furniture",
  "object_bedroom": "Furniture",
  "object_living_room": "Furniture",
  "object_office": "Tech",
  "object_studio": "Art",
  "object_gallery": "Art",
  "object_museum": "Art"
};

// Define valid categories that can be auto-selected
const VALID_CATEGORIES = [
  'Art', 'Auto', 'Bicycle', 'Books', 'Ephemera', 'Everyday Carry', 'Fashion', 
  'Furniture', 'HiFi', 'Industrial Design', 'Instruments', 'Lighting', 
  'Miscellaneous', 'Moto', 'Movie', 'Music', 'Photography', 'Tech', 
  'Timepieces', 'Vintage'
];

async function analyzeImage(imageUrl: string) {
  // Get environment variables at runtime
  const AZURE_ENDPOINT = process.env.AZURE_VISION_ENDPOINT;
  const AZURE_SUBSCRIPTION_KEY = process.env.AZURE_VISION_SUBSCRIPTION_KEY;
  
  // Validate environment variables
  if (!AZURE_ENDPOINT || !AZURE_SUBSCRIPTION_KEY) {
    throw new Error('Azure Vision environment variables not configured');
  }

  // Ensure endpoint ends with slash for proper URL joining
  const endpoint = AZURE_ENDPOINT.endsWith('/') ? AZURE_ENDPOINT : AZURE_ENDPOINT + '/';
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
      "Ocp-Apim-Subscription-Key": AZURE_SUBSCRIPTION_KEY,
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
      "Ocp-Apim-Subscription-Key": AZURE_SUBSCRIPTION_KEY,
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
  
  // Collect all possible mappings with their confidence scores
  const tagMappings: Array<{tag: string, category: string, confidence: number, type: 'direct' | 'partial'}> = [];
  
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Direct match
    if (TAG_TO_CATEGORY[normalizedTag]) {
      tagMappings.push({
        tag: tag,
        category: TAG_TO_CATEGORY[normalizedTag],
        confidence: 0.9,
        type: 'direct'
      });
      console.log(`✅ Found direct tag-based mapping: ${tag} → ${TAG_TO_CATEGORY[normalizedTag]}`);
    }
    
    // Partial match (check if tag contains any of our keywords)
    for (const [keyword, mappedCategory] of Object.entries(TAG_TO_CATEGORY)) {
      if (normalizedTag.includes(keyword) || keyword.includes(normalizedTag)) {
        tagMappings.push({
          tag: tag,
          category: mappedCategory,
          confidence: 0.8,
          type: 'partial'
        });
        console.log(`✅ Found partial tag-based mapping: ${tag} (contains "${keyword}") → ${mappedCategory}`);
      }
    }
  }
  
  // If we have multiple mappings, prioritize the most specific ones
  if (tagMappings.length > 0) {
    // Special handling for photography vs generic electronics
    const hasPhotographyMapping = tagMappings.some(m => m.category === 'Photography');
    const hasTechMapping = tagMappings.some(m => m.category === 'Tech');
    
    if (hasPhotographyMapping && hasTechMapping) {
      console.log('🎯 Photography vs Tech conflict detected - prioritizing Photography');
      // Filter to only photography mappings
      const photographyMappings = tagMappings.filter(m => m.category === 'Photography');
      tagMappings.splice(0, tagMappings.length, ...photographyMappings);
    }
    
    // Sort by confidence (direct matches first), then by specificity
    tagMappings.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence; // Higher confidence first
      }
      
      // For same confidence, prioritize more specific categories
      const specificityOrder = ['Photography', 'Art', 'Music', 'Books', 'Fashion', 'Furniture', 'Tech', 'Auto', 'Timepieces'];
      const aIndex = specificityOrder.indexOf(a.category);
      const bIndex = specificityOrder.indexOf(b.category);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex; // Lower index = more specific
      }
      
      return 0;
    });
    
    const bestMapping = tagMappings[0];
    category = bestMapping.category;
    categoryConfidence = bestMapping.confidence;
    console.log(`🎯 Selected best mapping: ${bestMapping.tag} → ${bestMapping.category} (${bestMapping.type}, confidence: ${bestMapping.confidence})`);
  }

  // Validate that the category is in our valid categories list
  if (category && !VALID_CATEGORIES.includes(category)) {
    console.log(`❌ Category "${category}" not in valid categories list, clearing auto-selection`);
    category = undefined;
    categoryConfidence = undefined;
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
    // Get environment variables at runtime
    const AZURE_ENDPOINT = process.env.AZURE_VISION_ENDPOINT;
    const AZURE_SUBSCRIPTION_KEY = process.env.AZURE_VISION_SUBSCRIPTION_KEY;
    
    // Validate environment variables at runtime
    if (!AZURE_ENDPOINT || !AZURE_SUBSCRIPTION_KEY) {
      return NextResponse.json(
        { error: 'Azure Vision service not configured' },
        { status: 503 }
      );
    }

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

