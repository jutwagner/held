// Simple script to seed the database with key entries for each category
const categorySeeds = {
  'Art': [
    { brand: 'Vincent van Gogh', item: 'The Starry Night', era: 'Post-Impressionism', country: 'Netherlands', type: 'Painting' },
    { brand: 'Pablo Picasso', item: 'Guernica', era: 'Cubism', country: 'Spain', type: 'Painting' },
    { brand: 'Leonardo da Vinci', item: 'Mona Lisa', era: 'Renaissance', country: 'Italy', type: 'Painting' },
    { brand: 'Claude Monet', item: 'Water Lilies', era: 'Impressionism', country: 'France', type: 'Painting' },
    { brand: 'Salvador Dalí', item: 'The Persistence of Memory', era: 'Surrealism', country: 'Spain', type: 'Painting' }
  ],
  
  'Music': [
    { brand: 'The Beatles', item: 'Abbey Road', era: 'Rock', country: 'United Kingdom', type: 'Album' },
    { brand: 'Pink Floyd', item: 'The Dark Side of the Moon', era: 'Progressive Rock', country: 'United Kingdom', type: 'Album' },
    { brand: 'Led Zeppelin', item: 'Led Zeppelin IV', era: 'Rock', country: 'United Kingdom', type: 'Album' },
    { brand: 'Queen', item: 'A Night at the Opera', era: 'Rock', country: 'United Kingdom', type: 'Album' },
    { brand: 'Bob Dylan', item: 'Highway 61 Revisited', era: 'Folk Rock', country: 'United States', type: 'Album' }
  ],
  
  'Books': [
    { brand: 'J.K. Rowling', item: 'Harry Potter and the Philosopher\'s Stone', era: 'Contemporary', country: 'United Kingdom', type: 'Fiction' },
    { brand: 'George R.R. Martin', item: 'A Game of Thrones', era: 'Contemporary', country: 'United States', type: 'Fiction' },
    { brand: 'Stephen King', item: 'The Shining', era: 'Contemporary', country: 'United States', type: 'Fiction' },
    { brand: 'Agatha Christie', item: 'Murder on the Orient Express', era: 'Modern', country: 'United Kingdom', type: 'Fiction' },
    { brand: 'Ernest Hemingway', item: 'The Old Man and the Sea', era: 'Modern', country: 'United States', type: 'Fiction' }
  ],
  
  'Photography': [
    { brand: 'Ansel Adams', item: 'Moonrise, Hernandez', era: 'Modern', country: 'United States', type: 'Landscape' },
    { brand: 'Henri Cartier-Bresson', item: 'The Decisive Moment', era: 'Modern', country: 'France', type: 'Street Photography' },
    { brand: 'Diane Arbus', item: 'Identical Twins', era: 'Contemporary', country: 'United States', type: 'Portrait' },
    { brand: 'Richard Avedon', item: 'Dovima with Elephants', era: 'Modern', country: 'United States', type: 'Fashion' },
    { brand: 'Irving Penn', item: 'Woman with Veil', era: 'Modern', country: 'United States', type: 'Portrait' }
  ],
  
  'Fashion': [
    { brand: 'Chanel', item: 'Little Black Dress', era: 'Modern', country: 'France', type: 'Haute Couture' },
    { brand: 'Dior', item: 'New Look', era: 'Modern', country: 'France', type: 'Haute Couture' },
    { brand: 'Gucci', item: 'GG Belt', era: 'Contemporary', country: 'Italy', type: 'Accessories' },
    { brand: 'Louis Vuitton', item: 'Speedy Bag', era: 'Modern', country: 'France', type: 'Accessories' },
    { brand: 'Versace', item: 'Medusa Head', era: 'Contemporary', country: 'Italy', type: 'Accessories' }
  ],
  
  'Furniture': [
    { brand: 'Herman Miller', item: 'Eames Lounge Chair', era: 'Mid-Century Modern', country: 'United States', type: 'Seating' },
    { brand: 'Knoll', item: 'Barcelona Chair', era: 'Modern', country: 'United States', type: 'Seating' },
    { brand: 'Vitra', item: 'Tulip Chair', era: 'Mid-Century Modern', country: 'Switzerland', type: 'Seating' },
    { brand: 'Eames', item: 'Wire Chair', era: 'Mid-Century Modern', country: 'United States', type: 'Seating' },
    { brand: 'Arne Jacobsen', item: 'Egg Chair', era: 'Mid-Century Modern', country: 'Denmark', type: 'Seating' }
  ],
  
  'Tech': [
    { brand: 'Apple', item: 'iPhone', era: 'Mobile Era', country: 'United States', type: 'Hardware' },
    { brand: 'Samsung', item: 'Galaxy S', era: 'Mobile Era', country: 'South Korea', type: 'Hardware' },
    { brand: 'Google', item: 'Pixel Phone', era: 'Mobile Era', country: 'United States', type: 'Hardware' },
    { brand: 'Microsoft', item: 'Surface Pro', era: 'Mobile Era', country: 'United States', type: 'Hardware' },
    { brand: 'Sony', item: 'PlayStation', era: 'Gaming Era', country: 'Japan', type: 'Hardware' }
  ],
  
  'Timepieces': [
    { brand: 'Rolex', item: 'Submariner', era: 'Modern', country: 'Switzerland', type: 'Dive Watch' },
    { brand: 'Patek Philippe', item: 'Nautilus', era: 'Modern', country: 'Switzerland', type: 'Sports Watch' },
    { brand: 'Omega', item: 'Speedmaster', era: 'Modern', country: 'Switzerland', type: 'Chronograph' },
    { brand: 'Audemars Piguet', item: 'Royal Oak', era: 'Modern', country: 'Switzerland', type: 'Sports Watch' },
    { brand: 'TAG Heuer', item: 'Carrera', era: 'Modern', country: 'Switzerland', type: 'Chronograph' }
  ],
  
  'Auto': [
    { brand: 'Ferrari', item: 'F40', era: 'Modern', country: 'Italy', type: 'Sports Car' },
    { brand: 'Lamborghini', item: 'Countach', era: 'Modern', country: 'Italy', type: 'Sports Car' },
    { brand: 'Porsche', item: '911', era: 'Modern', country: 'Germany', type: 'Sports Car' },
    { brand: 'BMW', item: 'M3', era: 'Modern', country: 'Germany', type: 'Sports Car' },
    { brand: 'Tesla', item: 'Model S', era: 'Electric Era', country: 'United States', type: 'Electric' }
  ]
};

// This would be used with a proper database connection
console.log('Category seeds prepared:');
Object.entries(categorySeeds).forEach(([category, items]) => {
  console.log(`${category}: ${items.length} items`);
  items.forEach(item => {
    console.log(`  - ${item.brand}: ${item.item}`);
  });
});

console.log('\nTo populate the database, run:');
console.log('node scripts/run-populate-db.js');
