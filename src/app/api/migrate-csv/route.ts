import { NextRequest, NextResponse } from 'next/server';
import { getBrandsByCategory, addBrandItem } from '@/lib/brands-firestore';
import fs from 'fs';
import path from 'path';

// Function to clean and validate data for Firestore
function cleanData(data: any) {
  return {
    category: String(data.category || '').trim().substring(0, 100),
    brand: String(data.brand || '').trim().substring(0, 100),
    item: String(data.item || '').trim().substring(0, 100),
    era: String(data.era || '').trim().substring(0, 50),
    country: String(data.country || '').trim().substring(0, 50),
    type: String(data.type || '').trim().substring(0, 50),
    notes: String(data.notes || '').trim().substring(0, 500),
  };
}

// Function to parse CSV line properly (handles commas in quoted fields)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { startIndex = 0, batchSize = 50 } = await request.json();
    
    console.log(`🚀 Starting CSV migration batch: ${startIndex} to ${startIndex + batchSize}`);
    
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'public', 'list.csv');
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'CSV file not found' }, { status: 404 });
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    const data = lines
      .filter(line => line.trim())
      .map(line => {
        const columns = parseCSVLine(line);
        return {
          category: columns[0] || '',
          brand: columns[1] || '',
          item: columns[2] || '',
          era: columns[3] || '',
          country: columns[4] || '',
          type: columns[5] || '',
          notes: columns[6] || ''
        };
      })
      .filter(row => row.category && row.brand); // Only valid entries
    
    // Get the batch to process
    const batch = data.slice(startIndex, startIndex + batchSize);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const row of batch) {
      try {
        const cleanRow = cleanData(row);
        
        // Validate required fields
        if (!cleanRow.category || !cleanRow.brand) {
          errors.push(`Invalid row: ${JSON.stringify(row)}`);
          errorCount++;
          continue;
        }
        
        await addBrandItem(cleanRow);
        successCount++;
        
      } catch (error) {
        console.error(`Error migrating entry:`, row, error);
        errors.push(`Error with ${row.category}/${row.brand}: ${error}`);
        errorCount++;
      }
    }
    
    const isComplete = startIndex + batchSize >= data.length;
    const nextIndex = isComplete ? null : startIndex + batchSize;
    
    return NextResponse.json({
      success: true,
      batch: {
        startIndex,
        batchSize,
        processed: batch.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 5), // Only return first 5 errors
        isComplete,
        nextIndex,
        totalEntries: data.length
      }
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check if migration is needed
    const csvPath = path.join(process.cwd(), 'public', 'list.csv');
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'CSV file not found' }, { status: 404 });
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1);
    const totalEntries = lines.filter(line => line.trim()).length;
    
    // Check how many entries are already in Firestore
    const existingBrands = await getBrandsByCategory('Art', 1); // Just check if any exist
    const hasData = existingBrands.length > 0;
    
    return NextResponse.json({
      csvEntries: totalEntries,
      hasFirestoreData: hasData,
      needsMigration: !hasData && totalEntries > 0
    });
    
  } catch (error) {
    console.error('Migration status check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check migration status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
