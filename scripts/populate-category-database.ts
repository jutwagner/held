import { db } from '../src/lib/firebase.admin';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Comprehensive category database with relevant brands, items, and metadata
const categoryDatabase = {
  'Art': {
    brands: [
      'Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Claude Monet', 'Salvador Dalí',
      'Frida Kahlo', 'Jackson Pollock', 'Andy Warhol', 'Georgia O\'Keeffe', 'Henri Matisse',
      'Wassily Kandinsky', 'Paul Cézanne', 'Edgar Degas', 'Pierre-Auguste Renoir', 'Gustav Klimt',
      'Rembrandt', 'Michelangelo', 'Raphael', 'Caravaggio', 'Johannes Vermeer',
      'Francisco Goya', 'Diego Velázquez', 'Titian', 'Botticelli', 'Jan van Eyck',
      'Mark Rothko', 'Willem de Kooning', 'Joan Miró', 'Paul Klee', 'Kandinsky',
      'Banksy', 'Jean-Michel Basquiat', 'Keith Haring', 'Yayoi Kusama', 'David Hockney'
    ],
    items: [
      'The Starry Night', 'Guernica', 'Mona Lisa', 'Water Lilies', 'The Persistence of Memory',
      'The Two Fridas', 'No. 1, 1950 (Lavender Mist)', 'Campbell\'s Soup Cans', 'Jimson Weed',
      'The Dance', 'Composition VII', 'The Card Players', 'The Ballet Class', 'Luncheon of the Boating Party',
      'The Kiss', 'The Night Watch', 'The Last Supper', 'The School of Athens', 'The Calling of St. Matthew',
      'Girl with a Pearl Earring', 'The Third of May 1808', 'Las Meninas', 'Venus of Urbino', 'The Birth of Venus',
      'The Arnolfini Portrait', 'Orange, Red, Yellow', 'Woman I', 'The Tilled Field', 'Senecio',
      'Girl with Balloon', 'Untitled (Skull)', 'Radiant Baby', 'Infinity Mirrors', 'A Bigger Splash'
    ],
    era: ['Renaissance', 'Baroque', 'Impressionism', 'Post-Impressionism', 'Cubism', 'Surrealism', 'Abstract Expressionism', 'Pop Art', 'Contemporary'],
    country: ['Netherlands', 'Spain', 'Italy', 'France', 'Germany', 'United States', 'Mexico', 'Japan', 'United Kingdom'],
    type: ['Painting', 'Sculpture', 'Drawing', 'Print', 'Photography', 'Mixed Media', 'Installation', 'Digital Art']
  },
  
  'Music': {
    brands: [
      'The Beatles', 'Pink Floyd', 'Led Zeppelin', 'Queen', 'The Rolling Stones',
      'Bob Dylan', 'David Bowie', 'Prince', 'Michael Jackson', 'Madonna',
      'Nirvana', 'Radiohead', 'U2', 'Coldplay', 'Adele',
      'Taylor Swift', 'Billie Eilish', 'Drake', 'Kendrick Lamar', 'Beyoncé',
      'Miles Davis', 'John Coltrane', 'Louis Armstrong', 'Duke Ellington', 'Charlie Parker',
      'Mozart', 'Beethoven', 'Bach', 'Chopin', 'Tchaikovsky',
      'Frank Sinatra', 'Ella Fitzgerald', 'Billie Holiday', 'Nina Simone', 'Aretha Franklin',
      'Elvis Presley', 'Johnny Cash', 'Bob Marley', 'Jimi Hendrix', 'Eric Clapton'
    ],
    items: [
      'Abbey Road', 'The Dark Side of the Moon', 'Led Zeppelin IV', 'A Night at the Opera', 'Exile on Main St.',
      'Highway 61 Revisited', 'The Rise and Fall of Ziggy Stardust', 'Purple Rain', 'Thriller', 'Like a Virgin',
      'Nevermind', 'OK Computer', 'The Joshua Tree', 'Parachutes', '21',
      '1989', 'When We All Fall Asleep', 'Views', 'To Pimp a Butterfly', 'Lemonade',
      'Kind of Blue', 'A Love Supreme', 'What a Wonderful World', 'Take the A Train', 'Bird of Paradise',
      'Symphony No. 40', 'Symphony No. 9', 'Brandenburg Concertos', 'Nocturnes', 'Swan Lake',
      'My Way', 'Summertime', 'Strange Fruit', 'Feeling Good', 'Respect',
      'Heartbreak Hotel', 'Folsom Prison Blues', 'Legend', 'Are You Experienced', 'Layla'
    ],
    era: ['Classical', 'Jazz', 'Blues', 'Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Folk', 'Country', 'R&B'],
    country: ['United States', 'United Kingdom', 'Jamaica', 'Germany', 'Austria', 'France', 'Canada', 'Australia', 'Japan'],
    type: ['Album', 'Single', 'EP', 'Live Recording', 'Compilation', 'Soundtrack', 'Instrumental', 'Vocal']
  },
  
  'Books': {
    brands: [
      'J.K. Rowling', 'George R.R. Martin', 'Stephen King', 'Agatha Christie', 'Ernest Hemingway',
      'F. Scott Fitzgerald', 'Mark Twain', 'Charles Dickens', 'Jane Austen', 'Virginia Woolf',
      'Toni Morrison', 'Maya Angelou', 'James Baldwin', 'Zora Neale Hurston', 'Langston Hughes',
      'Gabriel García Márquez', 'Milan Kundera', 'Haruki Murakami', 'Isabel Allende', 'Chimamanda Ngozi Adichie',
      'Salman Rushdie', 'Arundhati Roy', 'Vikram Seth', 'Jhumpa Lahiri', 'Rohinton Mistry',
      'Margaret Atwood', 'Alice Munro', 'Michael Ondaatje', 'Yann Martel', 'Robertson Davies',
      'Umberto Eco', 'Italo Calvino', 'Primo Levi', 'Elena Ferrante', 'Dante Alighieri'
    ],
    items: [
      'Harry Potter and the Philosopher\'s Stone', 'A Game of Thrones', 'The Shining', 'Murder on the Orient Express', 'The Old Man and the Sea',
      'The Great Gatsby', 'Adventures of Huckleberry Finn', 'A Tale of Two Cities', 'Pride and Prejudice', 'Mrs. Dalloway',
      'Beloved', 'I Know Why the Caged Bird Sings', 'Go Tell It on the Mountain', 'Their Eyes Were Watching God', 'The Weary Blues',
      'One Hundred Years of Solitude', 'The Unbearable Lightness of Being', 'Norwegian Wood', 'The House of the Spirits', 'Half of a Yellow Sun',
      'Midnight\'s Children', 'The God of Small Things', 'A Suitable Boy', 'Interpreter of Maladies', 'Such a Long Journey',
      'The Handmaid\'s Tale', 'The Lives of Girls and Women', 'The English Patient', 'Life of Pi', 'Fifth Business',
      'The Name of the Rose', 'Invisible Cities', 'If This Is a Man', 'My Brilliant Friend', 'The Divine Comedy'
    ],
    era: ['Classical', 'Medieval', 'Renaissance', 'Enlightenment', 'Romantic', 'Victorian', 'Modern', 'Postmodern', 'Contemporary'],
    country: ['United States', 'United Kingdom', 'Canada', 'India', 'Italy', 'France', 'Germany', 'Japan', 'Nigeria', 'Colombia'],
    type: ['Fiction', 'Non-Fiction', 'Poetry', 'Drama', 'Biography', 'Autobiography', 'Memoir', 'Essay', 'Short Story', 'Novel']
  },
  
  'Photography': {
    brands: [
      'Ansel Adams', 'Henri Cartier-Bresson', 'Diane Arbus', 'Richard Avedon', 'Irving Penn',
      'Dorothea Lange', 'Walker Evans', 'Robert Capa', 'Sebastião Salgado', 'Steve McCurry',
      'Annie Leibovitz', 'Helmut Newton', 'Cindy Sherman', 'Nan Goldin', 'Sally Mann',
      'Vivian Maier', 'Garry Winogrand', 'Lee Friedlander', 'William Eggleston', 'Stephen Shore',
      'Robert Frank', 'Weegee', 'Gordon Parks', 'James Van Der Zee', 'Roy DeCarava',
      'Man Ray', 'André Kertész', 'Brassaï', 'Robert Doisneau', 'Eugène Atget',
      'Cindy Sherman', 'Nan Goldin', 'Sally Mann', 'Diane Arbus', 'Vivian Maier'
    ],
    items: [
      'Moonrise, Hernandez', 'The Decisive Moment', 'Identical Twins', 'Dovima with Elephants', 'Woman with Veil',
      'Migrant Mother', 'Subway Portrait', 'The Falling Soldier', 'Workers', 'Afghan Girl',
      'John Lennon and Yoko Ono', 'Woman with Cigar', 'Untitled Film Stills', 'The Ballad of Sexual Dependency', 'Immediate Family',
      'Self-Portrait', 'New York', 'The Americans', 'Uncommon Places', 'The Americans',
      'The Americans', 'Naked City', 'A Great Day in Harlem', 'The Sweet Flypaper of Life', 'The Family of Man',
      'Rayograph', 'Distortion', 'Paris by Night', 'The Kiss at the Hôtel de Ville', 'The Old Paris',
      'Untitled Film Stills', 'The Ballad of Sexual Dependency', 'Immediate Family', 'Identical Twins', 'Self-Portrait'
    ],
    era: ['Victorian', 'Modern', 'Contemporary', 'Postmodern', 'Digital Age'],
    country: ['United States', 'France', 'Germany', 'Japan', 'United Kingdom', 'Brazil', 'Canada', 'Italy'],
    type: ['Portrait', 'Landscape', 'Street Photography', 'Documentary', 'Fashion', 'Fine Art', 'Photojournalism', 'Abstract']
  },
  
  'Fashion': {
    brands: [
      'Chanel', 'Dior', 'Gucci', 'Louis Vuitton', 'Prada', 'Versace', 'Armani', 'Valentino',
      'Balenciaga', 'Saint Laurent', 'Givenchy', 'Hermès', 'Burberry', 'Ralph Lauren',
      'Tom Ford', 'Alexander McQueen', 'Vivienne Westwood', 'Comme des Garçons', 'Issey Miyake',
      'Yohji Yamamoto', 'Rei Kawakubo', 'Martin Margiela', 'Helmut Lang', 'Jil Sander',
      'Calvin Klein', 'Donna Karan', 'Oscar de la Renta', 'Carolina Herrera', 'Vera Wang',
      'Coco Chanel', 'Christian Dior', 'Gianni Versace', 'Giorgio Armani', 'Valentino Garavani'
    ],
    items: [
      'Little Black Dress', 'Tweed Suit', 'New Look', 'GG Belt', 'Speedy Bag',
      'Nylon Backpack', 'Medusa Head', 'Power Suit', 'Red Dress', 'Balenciaga Triple S',
      'Le Cagole', 'Sac de Jour', 'Birkin Bag', 'Trench Coat', 'Polo Shirt',
      'Tom Ford Suit', 'McQueen Skull', 'Pirate Boots', 'CDG Play', 'Pleats Please',
      'Y-3 Collection', 'Comme des Garçons', 'Margiela Tabi', 'Helmut Lang', 'Jil Sander',
      'CK Underwear', 'DKNY', 'Oscar Gown', 'Carolina Herrera', 'Vera Wang Wedding',
      'Chanel No. 5', 'Dior J\'adore', 'Versace Eros', 'Armani Code', 'Valentino V'
    ],
    era: ['Victorian', 'Edwardian', 'Art Deco', 'Modern', 'Contemporary', 'Postmodern'],
    country: ['France', 'Italy', 'United States', 'United Kingdom', 'Japan', 'Germany', 'Belgium', 'Spain'],
    type: ['Haute Couture', 'Ready-to-Wear', 'Accessories', 'Jewelry', 'Shoes', 'Bags', 'Fragrance', 'Cosmetics']
  },
  
  'Furniture': {
    brands: [
      'Herman Miller', 'Knoll', 'Vitra', 'IKEA', 'West Elm', 'Crate & Barrel',
      'Eames', 'Mies van der Rohe', 'Le Corbusier', 'Charles Eames', 'Ray Eames',
      'Arne Jacobsen', 'Eero Saarinen', 'Marcel Breuer', 'Ludwig Mies van der Rohe',
      'Le Corbusier', 'Jean Prouvé', 'Charlotte Perriand', 'Pierre Jeanneret',
      'Finn Juhl', 'Hans Wegner', 'Poul Kjærholm', 'Verner Panton', 'Poul Henningsen',
      'Alvar Aalto', 'Eero Aarnio', 'Yrjö Kukkapuro', 'Ilmari Tapiova', 'Kaj Franck'
    ],
    items: [
      'Eames Lounge Chair', 'Wassily Chair', 'LC4 Chaise Longue', 'Barcelona Chair', 'Tulip Chair',
      'Egg Chair', 'Swan Chair', 'Bauhaus Chair', 'LC2 Sofa', 'LC3 Sofa',
      'Wishbone Chair', 'Shell Chair', 'Panton Chair', 'PH5 Pendant', 'Aalto Stool',
      'Ball Chair', 'Bubble Chair', 'Pastil Chair', 'Kartio Glass', 'Teema Tableware',
      'Eames Molded Plastic Chair', 'Wire Chair', 'LC1 Chair', 'LC5 Sofa', 'LC6 Table',
      'Series 7 Chair', 'Ant Chair', 'Drop Chair', 'PK22 Chair', 'PK24 Chaise'
    ],
    era: ['Art Deco', 'Bauhaus', 'Mid-Century Modern', 'Contemporary', 'Postmodern'],
    country: ['United States', 'Germany', 'Denmark', 'Finland', 'France', 'Italy', 'Sweden', 'Netherlands'],
    type: ['Seating', 'Tables', 'Storage', 'Lighting', 'Accessories', 'Outdoor', 'Office', 'Bedroom']
  },
  
  'Tech': {
    brands: [
      'Apple', 'Samsung', 'Google', 'Microsoft', 'Sony', 'Panasonic', 'Canon', 'Nikon',
      'Intel', 'AMD', 'NVIDIA', 'ASUS', 'Dell', 'HP', 'Lenovo', 'Acer',
      'Tesla', 'SpaceX', 'Amazon', 'Meta', 'Netflix', 'Spotify', 'Adobe', 'Autodesk',
      'Cisco', 'Juniper', 'Aruba', 'Fortinet', 'Palo Alto', 'Check Point', 'F5', 'Citrix'
    ],
    items: [
      'iPhone', 'MacBook Pro', 'iPad', 'AirPods', 'Apple Watch', 'Galaxy S', 'Galaxy Tab',
      'Pixel Phone', 'Chromebook', 'Surface Pro', 'PlayStation', 'Bravia TV', 'Lumix Camera',
      'Core i7', 'Ryzen 9', 'RTX 4090', 'ROG Laptop', 'XPS 13', 'EliteBook', 'ThinkPad',
      'Model S', 'Falcon 9', 'Echo Dot', 'Quest 2', 'Netflix App', 'Spotify Premium',
      'Photoshop', 'AutoCAD', 'Catalyst Switch', 'MX Router', 'FortiGate', 'Check Point',
      'BIG-IP', 'NetScaler', 'Workspace', 'ShareFile', 'Citrix Cloud'
    ],
    era: ['Mainframe', 'PC Revolution', 'Internet Age', 'Mobile Era', 'Cloud Computing', 'AI Era'],
    country: ['United States', 'South Korea', 'Japan', 'China', 'Taiwan', 'Germany', 'Netherlands', 'Israel'],
    type: ['Hardware', 'Software', 'Services', 'Networking', 'Security', 'Cloud', 'AI/ML', 'IoT']
  },
  
  'Timepieces': {
    brands: [
      'Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'TAG Heuer', 'Breitling',
      'Cartier', 'Jaeger-LeCoultre', 'IWC', 'Panerai', 'Vacheron Constantin', 'A. Lange & Söhne',
      'Blancpain', 'Breguet', 'Chopard', 'Girard-Perregaux', 'Hublot', 'Richard Mille',
      'Seiko', 'Citizen', 'Casio', 'Timex', 'Swatch', 'Tissot', 'Longines', 'Hamilton'
    ],
    items: [
      'Submariner', 'Daytona', 'GMT-Master', 'Datejust', 'Explorer', 'Sky-Dweller',
      'Nautilus', 'Aquanaut', 'Calatrava', 'Royal Oak', 'Speedmaster', 'Seamaster',
      'Carrera', 'Monaco', 'Navitimer', 'Chronomat', 'Santos', 'Tank', 'Ballon Bleu',
      'Reverso', 'Master Control', 'Portuguese', 'Pilot', 'Luminor', 'Radiomir',
      'Overseas', 'Fiftysix', 'Lange 1', 'Saxonia', 'Villeret', 'Classique',
      'L.U.C', 'Perpetual Calendar', 'Big Bang', 'RM 011', 'Grand Seiko', 'ProMaster'
    ],
    era: ['Pocket Watch Era', 'Wristwatch Revolution', 'Quartz Crisis', 'Mechanical Renaissance', 'Smartwatch Era'],
    country: ['Switzerland', 'Germany', 'Japan', 'United States', 'France', 'Italy', 'United Kingdom'],
    type: ['Dress Watch', 'Sports Watch', 'Dive Watch', 'Chronograph', 'Complication', 'Smartwatch', 'Vintage', 'Limited Edition']
  },
  
  'Auto': {
    brands: [
      'Ferrari', 'Lamborghini', 'Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen',
      'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Lexus', 'Acura', 'Infiniti',
      'Ford', 'Chevrolet', 'Cadillac', 'Lincoln', 'Buick', 'Chrysler', 'Dodge', 'Jeep',
      'Tesla', 'Rivian', 'Lucid', 'Polestar', 'Genesis', 'Hyundai', 'Kia'
    ],
    items: [
      'F40', 'Countach', '911', 'M3', 'S-Class', 'R8', 'Golf GTI',
      'Supra', 'NSX', 'GT-R', 'MX-5', 'WRX', 'LC 500', 'NSX', 'Q50',
      'Mustang', 'Corvette', 'Escalade', 'Continental', 'Enclave', '300', 'Challenger', 'Wrangler',
      'Model S', 'R1T', 'Air', '2', 'G90', 'Elantra', 'Stinger'
    ],
    era: ['Vintage', 'Classic', 'Modern', 'Contemporary', 'Electric Era'],
    country: ['Italy', 'Germany', 'Japan', 'United States', 'South Korea', 'Sweden', 'United Kingdom'],
    type: ['Sports Car', 'Luxury', 'SUV', 'Sedan', 'Coupe', 'Convertible', 'Electric', 'Hybrid']
  }
};

async function populateDatabase() {
  console.log('Starting database population...');
  
  for (const [category, data] of Object.entries(categoryDatabase)) {
    console.log(`Populating ${category}...`);
    
    for (const brand of data.brands) {
      for (const item of data.items.slice(0, 5)) { // Limit items per brand to avoid too many entries
        const randomEra = data.era[Math.floor(Math.random() * data.era.length)];
        const randomCountry = data.country[Math.floor(Math.random() * data.country.length)];
        const randomType = data.type[Math.floor(Math.random() * data.type.length)];
        
        try {
          await addDoc(collection(db, 'brands'), {
            category,
            brand,
            item,
            era: randomEra,
            country: randomCountry,
            type: randomType,
            notes: `Auto-populated ${category} entry`,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`Added: ${brand} - ${item}`);
        } catch (error) {
          console.error(`Error adding ${brand} - ${item}:`, error);
        }
      }
    }
  }
  
  console.log('Database population completed!');
}

// Run the population script
if (require.main === module) {
  populateDatabase().catch(console.error);
}

export { populateDatabase };
