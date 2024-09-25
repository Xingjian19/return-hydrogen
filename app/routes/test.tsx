import { json, type LoaderFunctionArgs } from '@shopify/remix-oxygen';
import { Form, NavLink, Outlet, useLoaderData } from '@remix-run/react';
import { CUSTOMER_DETAILS_QUERY } from '~/graphql/customer-account/CustomerDetailsQuery';
import React, { useState } from 'react';
import { Cascader } from 'antd';
import '../styles/custom.css';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({ context }: any) {
    // try {
    //     const response = await fetch('https://jsonplaceholder.typicode.com/todos/1', {
    //         method: 'GET',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         }
    //     });

    //     const text = await response.text(); // 获取响应的文本内容
    //     console.log('Response text:', text); // 打印响应的文本内容

    //     if (!response.ok) {
    //         throw new Error('Network response was not ok');
    //     }

    //     const data = JSON.parse(text); // 将文本内容解析为 JSON
    //     return json(data);
    // } catch (error) {
    //     console.error('Fetch error:', error);
    //     return json({ error: 'Failed to fetch data' }, { status: 500 });
    // }
    return null;
}

export default function ImageUploader(){
  const options = [
    {
      value: 'zhejiang',
      label: 'Zhejiang',
      children: [
        {
          value: 'hangzhou',
          label: 'Hangzhou',
          children: [
            {
              value: 'xihu',
              label: 'West Lake',
            },
          ],
        },
      ],
    },
    {
      value: 'jiangsu',
      label: 'Jiangsu',
      children: [
        {
          value: 'nanjing',
          label: 'Nanjing',
          children: [
            {
              value: 'zhonghuamen',
              label: 'Zhong Hua Men',
            },
          ],
        },
      ],
    },
  ];
  
  const handleChange = (value) => {
    console.log(value);
  };

  return (
    <Cascader options={options} onChange={handleChange} placeholder="Please select" />
  );
}

// export default function ImageUploader() {
//     const cancelImageSelection = (index: number) => {
//         setSelectedImages((prevSelectedImages) => {
//             const updatedImages = [...prevSelectedImages];
//             updatedImages.splice(index, 1);
//             return updatedImages;
//         });
//     };
//     const [selectedImages, setSelectedImages] = React.useState<File[]>([]);
//     const [errorMessage, setErrorMessage] = React.useState<string>('');

//     const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const files = event.target.files;
//         if (files) {
//             const newSelectedImages = Array.from(files);
//             setSelectedImages((prevSelectedImages) => [...prevSelectedImages, ...newSelectedImages]);
//         }
//     };

//     const uploadImages = async () => {
//         const formData = new FormData();
//         selectedImages.forEach((image) => {
//             formData.append('images', image);
//         });

//         try {
//             const response = await fetch('YOUR_UPLOAD_ENDPOINT', {
//                 method: 'POST',
//                 body: formData,
//             });
//             const responseData = await response.json();
//             console.log('Images uploaded successfully', responseData);
//         } catch (error) {
//             console.error('Error uploading images', error);
//         }
//     };
//     const [isOpen, setIsOpen] = useState(false);
//     const [selectedOption, setSelectedOption] = useState('');
//     const [secondColumnOptions, setSecondColumnOptions] = useState<string[]>([]);

//     const toggleDropdown = () => {
//         setIsOpen(!isOpen);
//     };

//     const handleFirstColumnClick = (option: string) => {
//         setSelectedOption(option);
//         setIsOpen(false);

//         // 根据选择的第一列选项更新第二列选项
//         switch (option) {
//             case 'Option 1':
//                 setSecondColumnOptions(['Option 1-1', 'Option 1-2', 'Option 1-3']);
//                 break;
//             case 'Option 2':
//                 setSecondColumnOptions(['Option 2-1', 'Option 2-2', 'Option 2-3']);
//                 break;
//             case 'Option 3':
//                 setSecondColumnOptions(['Option 3-1', 'Option 3-2', 'Option 3-3']);
//                 break;
//             default:
//                 setSecondColumnOptions([]);
//         }
//     };
//     return (
//         <div>
//             <div className="flex flex-col items-center">
//                 <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleImageChange}
//                     className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     multiple // Allow multiple file selection
//                 />
//                 {selectedImages.map((image, index) => (
//                     <div key={index} className="flex items-center">
//                         <img src={URL.createObjectURL(image)} alt={`Preview ${index}`} className="mt-4 w-48 h-auto" />
//                         <button
//                             onClick={() => cancelImageSelection(index)}
//                             className="mt-2 py-1 px-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                         >
//                             Cancel
//                         </button>
//                     </div>
//                 ))}
//                 <button
//                     onClick={uploadImages}
//                     disabled={selectedImages.length === 0}
//                     className="mt-4 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                     Upload Images
//                 </button>
//             </div>
//             <div className="ml-20 relative inline-block text-left">
//                 <button
//                     onClick={toggleDropdown}
//                     className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                 >
//                     {selectedOption || 'Select an option'}
//                 </button>

//                 {isOpen && (
//                     <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
//                         <div className="py-1 grid grid-cols-2 gap-4" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
//                             <div>
//                                 <a
//                                     href="#"
//                                     onClick={() => handleFirstColumnClick('Option 1')}
//                                     className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                     role="menuitem"
//                                 >
//                                     Option 1
//                                 </a>
//                                 <a
//                                     href="#"
//                                     onClick={() => handleFirstColumnClick('Option 2')}
//                                     className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                     role="menuitem"
//                                 >
//                                     Option 2
//                                 </a>
//                                 <a
//                                     href="#"
//                                     onClick={() => handleFirstColumnClick('Option 3')}
//                                     className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                     role="menuitem"
//                                 >
//                                     Option 3
//                                 </a>
//                             </div>
//                             <div>
//                                 {secondColumnOptions.map((option, index) => (
//                                     <a
//                                         key={index}
//                                         href="#"
//                                         className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                         role="menuitem"
//                                     >
//                                         {option}
//                                     </a>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

// export default function AccountLayout() {
//     const [imageSrc, setImageSrc] = React.useState<string | null>(null);

//     const uploadImage = async () => {
//         const formData = new FormData();
//         if (imageSrc) {
//             formData.append('image', imageSrc);
//         }

//         try {
//             const response = await fetch('YOUR_UPLOAD_ENDPOINT', {
//                 method: 'POST',
//                 body: formData,
//             });
//             const responseData = await response.json();
//             console.log('Image uploaded successfully', responseData);
//         } catch (error) {
//             console.error('Error uploading image', error);
//         }
//     };

//     const handleImagePreview = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const files = event.target.files;
//         if (files) {
//             const newImageSrc = URL.createObjectURL(files[0]);
//             setImageSrc(newImageSrc);
//         }
//     };

//     return (
//         <div>
//             <div className="flex flex-col items-center">
//                 <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleImagePreview}
//                     className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//                 {imageSrc && <img src={imageSrc} alt="Preview" className="mt-4 w-48 h-auto" />}
//                 <button
//                     onClick={uploadImage}
//                     disabled={!imageSrc}
//                     className="mt-4 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                     Upload Image
//                 </button>
//             </div>
//             <ImageUploader />
//         </div>
//     );
// }
//     <div>
//         <div className="flex flex-col items-center">
//             <input type="file" accept="image/*" onChange={handleImageChange} className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
//             {imageSrc && <img src={imageSrc} alt="Preview" className="mt-4 w-48 h-auto" />}
//             <button onClick={uploadImage} disabled={!imageSrc} className="mt-4 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//                 Upload Image
//             </button>
//         </div>
//     </div>
// );
// }
export async function action({ request }: LoaderFunctionArgs) {
    if(request.method === 'POST'){
      return json({ ok: 'halo' });
    }
    return json({ ok: true });
  }
