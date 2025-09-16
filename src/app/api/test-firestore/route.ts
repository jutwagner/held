import { NextRequest, NextResponse } from 'next/server';
import { getBrandsByCategory, addBrandItem } from '@/lib/brands-firestore';

export async function GET() {
  try {
    console.log('🧪 Testing Firestore connection...');
    
    // Test reading from Firestore
    const testBrands = await getBrandsByCategory('Art', 5);
    console.log('✅ Successfully read from Firestore:', testBrands.length, 'brands');
    
    return NextResponse.json({
      success: true,
      message: 'Firestore connection working!',
      testData: {
        brandsFound: testBrands.length,
        sampleBrands: testBrands.slice(0, 3)
      }
    });
    
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🧪 Testing Firestore write...');
    
    // Test writing to Firestore
    const testId = await addBrandItem({
      category: 'Test',
      brand: 'Test Brand',
      item: 'Test Item',
      era: '2020s',
      country: 'USA',
      type: 'Test Type',
      notes: 'Test notes'
    });
    
    console.log('✅ Successfully wrote to Firestore:', testId);
    
    return NextResponse.json({
      success: true,
      message: 'Firestore write working!',
      testId
    });
    
  } catch (error) {
    console.error('❌ Firestore write test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
