import { NextRequest, NextResponse } from 'next/server';
import { getBrandsByCategory, getItemsByBrand, addBrandItem, checkBrandItemExists } from '@/lib/brands-firestore';

// GET /api/brands?category=Art&brand=SomeBrand
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!category) {
      return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
    }

    let data;
    if (brand) {
      // Get items for a specific brand
      data = await getItemsByBrand(category, brand, limit);
    } else {
      // Get brands for a category
      data = await getBrandsByCategory(category, limit);
    }

    return NextResponse.json({ 
      success: true, 
      data,
      count: data.length 
    });

  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

// POST /api/brands - Add new brand/item
export async function POST(request: NextRequest) {
  try {
    const { category, brand, item, era, country, type, notes } = await request.json();

    if (!category || !brand) {
      return NextResponse.json({ 
        error: 'Category and brand are required' 
      }, { status: 400 });
    }

    // Check if entry already exists
    const exists = await checkBrandItemExists(category, brand, item || '');
    if (exists) {
      return NextResponse.json({ 
        error: 'Entry already exists' 
      }, { status: 409 });
    }

    // Add new entry
    const id = await addBrandItem({
      category,
      brand,
      item: item || '',
      era: era || '',
      country: country || '',
      type: type || '',
      notes: notes || ''
    });

    return NextResponse.json({ 
      success: true, 
      id,
      message: 'Brand item added successfully' 
    });

  } catch (error) {
    console.error('Error adding brand item:', error);
    return NextResponse.json({ error: 'Failed to add brand item' }, { status: 500 });
  }
}
