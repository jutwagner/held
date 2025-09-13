import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { category, brand, item, era = '', country = '', type = '', notes = '' } = await request.json();

    // At minimum, we need category and brand. Item can be empty when adding just a brand.
    if (!category || !brand) {
      return NextResponse.json({ error: 'Missing required fields: category and brand are required' }, { status: 400 });
    }

    // Path to the CSV file
    const csvPath = path.join(process.cwd(), 'public', 'list.csv');
    
    // Read existing CSV content
    let csvContent = '';
    if (fs.existsSync(csvPath)) {
      csvContent = fs.readFileSync(csvPath, 'utf-8');
    } else {
      // Create header if file doesn't exist
      csvContent = 'Category,Maker/Brand,Name/Model,Era/Decade,Country,Type/Subcategory,Notes\n';
    }

    // Check if the entry already exists
    const lines = csvContent.split('\n');
    const header = lines[0];
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    // Check for duplicate - check all three fields (category, brand, item)
    // This allows multiple items per brand, but prevents exact duplicates
    const isDuplicate = dataLines.some(line => {
      const columns = line.split(',');
      return columns[0]?.trim() === category && 
             columns[1]?.trim() === brand &&
             columns[2]?.trim() === item;
    });

    if (isDuplicate) {
      return NextResponse.json({ error: 'Entry already exists' }, { status: 409 });
    }

    // Add new entry
    const newEntry = `${category},${brand},${item},${era},${country},${type},${notes}`;
    const updatedContent = csvContent.trim() + '\n' + newEntry + '\n';

    // Write back to file
    fs.writeFileSync(csvPath, updatedContent, 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: 'CSV updated successfully',
      entry: { category, brand, item, era, country, type, notes }
    });

  } catch (error) {
    console.error('Error updating CSV:', error);
    return NextResponse.json({ error: 'Failed to update CSV' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Path to the CSV file
    const csvPath = path.join(process.cwd(), 'public', 'list.csv');
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'CSV file not found' }, { status: 404 });
    }

    // Read CSV content
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const header = lines[0];
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    // Parse CSV data
    const data = dataLines.map(line => {
      const columns = line.split(',');
      return {
        category: columns[0]?.trim() || '',
        brand: columns[1]?.trim() || '',
        item: columns[2]?.trim() || '',
        era: columns[3]?.trim() || '',
        country: columns[4]?.trim() || '',
        type: columns[5]?.trim() || '',
        notes: columns[6]?.trim() || ''
      };
    });

    return NextResponse.json({ 
      success: true, 
      data,
      header: header.split(',')
    });

  } catch (error) {
    console.error('Error reading CSV:', error);
    return NextResponse.json({ error: 'Failed to read CSV' }, { status: 500 });
  }
}
