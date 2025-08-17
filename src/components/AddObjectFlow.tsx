import React, { useState } from 'react';
import Image from 'next/image';

type AddObjectFlowProps = {
  onPhotoSelected?: (photo: string) => void; // Made optional
};

const AddObjectFlow: React.FC<AddObjectFlowProps> = ({ onPhotoSelected }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState<string>('No photo selected'); // Ensure default name is set
  const [step, setStep] = useState<number>(1); // Added step state to track the current step
  const [title, setTitle] = useState<string>(''); // Added title state
  const [tags, setTags] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [visibility, setVisibility] = useState<boolean>(true);
  const [description, setDescription] = useState<string>('');
  const [condition, setCondition] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setName(file.name); // Update name state
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const photoUrl = ev.target.result as string;
          setPhoto(photoUrl);
          if (onPhotoSelected) {
            onPhotoSelected(photoUrl); // Call only if provided
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = () => {
    setStep((prevStep) => prevStep + 1); // Increment step to move to the next step
  };

  return (
    <div className="flex flex-col items-center">
      {step === 1 && (
        <>
          <div className="w-72 h-44 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            {photo ? (
              <Image src={photo} alt="Selected Photo" width={400} height={400} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">{name}</span>
            )}
          </div>
          <input
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-4 px-4 py-2 border rounded w-72"
          />
          <label className="mt-4 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer">
            Snap or Choose Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <button
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded cursor-pointer"
            onClick={handleNextStep} // Move to the next step
          >
            Next
          </button>
        </>
      )}
      {step === 2 && (
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-bold mb-4">Step 2: Add Details</h2>
          <textarea
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-4 px-4 py-2 border rounded w-72 h-24"
          ></textarea>
          <input
            type="text"
            placeholder="Enter tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mb-4 px-4 py-2 border rounded w-72"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mb-4 px-4 py-2 border rounded w-72"
          />
          <input
            type="number"
            placeholder="Enter price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mb-4 px-4 py-2 border rounded w-72"
          />
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="mb-4 px-4 py-2 border rounded w-72"
          >
            <option value="">Select condition</option>
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="refurbished">Refurbished</option>
          </select>
          <div className="mb-4 flex items-center">
            <label className="mr-2">Visibility:</label>
            <input
              type="checkbox"
              checked={visibility}
              onChange={(e) => setVisibility(e.target.checked)}
            />
          </div>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer"
            onClick={() => alert('Details saved!')} // Placeholder for saving details
          >
            Save Details
          </button>
        </div>
      )}
    </div>
  );
};

export default AddObjectFlow;