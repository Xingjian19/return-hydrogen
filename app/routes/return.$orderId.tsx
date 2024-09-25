import { useFetcher, useLoaderData } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@shopify/remix-oxygen';
import React, { useRef, useEffect, useState, Component } from 'react';
import '../styles/custom.css';
import TextareaAutosize from 'react-textarea-autosize';
import { MdOutlineAddPhotoAlternate } from "react-icons/md";
import { meta } from './($locale)._index';
import Product from './($locale).products.$handle';
import { responsePathAsArray } from 'graphql';
import { Cascader } from 'antd';
import { set } from 'react-ga';
import { IoMdArrowBack } from "react-icons/io";
// import AWS from 'aws-sdk'

export default function Refund() {
  const { orderId, flineItems, metaobjects, order, unReturnItem, key } = useLoaderData<typeof loader>();
  const customerEmail = order.data.order.email;
  //发送事件
  // const sendPageEvent = () => {
  //   // 你的 refund 函数逻辑
  //   AWS.config.update({
  //     region: 'us-east-2',
  //     credentials: new AWS.CognitoIdentityCredentials({
  //       IdentityPoolId: 'us-east-2:27577371-3612-4412-8534-76fbd47dc8aa',
  //     }),
  //   });

  //   // 检查凭证是否正确获取
  //   AWS.config.credentials.get((err: any) => {
  //     if (err) {
  //       console.error('Error retrieving credentials:', err);
  //     }
  //   });

  //   // 初始化 AWS Kinesis 客户端
  //   const kinesis = new AWS.Kinesis({
  //     apiVersion: '2013-12-02', // 替换为你的 API 版本
  //   });

  //   //获取当前设备
  //   const userAgent = navigator.userAgent.toLowerCase();
  //   const isMobile = /iphone|ipod|android|blackberry|opera mini|iemobile|mobile/i.test(userAgent);
  //   const deviceType = isMobile ? 'web_pc' : 'web_m';
  //   const data = {
  //     event: {
  //       page_name: `return_request_prod`,
  //     },
  //     common: {
  //       email: `${customerEmail}`,
  //       platform: `${deviceType}`,
  //     },
  //     item_id: `pageview`,
  //   };
  //   // 生成凭证对象
  //   const credentials = AWS.config.credentials;
  //   const recordData = JSON.stringify(data);
  //   // 设置 Kinesis 参数
  //   const params = {
  //     Data: recordData,
  //     //Event: 'pageview',
  //     PartitionKey: `partition-${credentials!.identityId}`,
  //     StreamName: 'web-data-stream',
  //   };

  //   // 发送事件数据到 Kinesis
  //   kinesis.putRecord(params, (err, data) => {
  //     if (err) {
  //       console.error('Error sending data to Kinesis:', err);
  //     }
  //   });
  // };

  const dataFetchedRef = useRef(false);
  // useEffect(() => {
  //   if (dataFetchedRef.current) {
  //     return;
  //   }
  //   dataFetchedRef.current = true;
  //   sendPageEvent();
  //   (async () => {
  //     const returnLineItem = await fetchReturnLineItem();
  //     console.log('Return line item:', returnLineItem);
  //   })();
  // }, []);

  //returnItems初始化
  let [returnItems, setReturnItems] = useState<any[]>([]);
  let [products, setProducts] = useState<any[]>([]);
  let [showUnReturnItems, setShowUnReturnItems] = useState<any[]>(unReturnItem);
  //统计所有unReturnItem的数量
  let totalUnreturnQuantity = 0;
  unReturnItem.forEach((item: any) => {
    totalUnreturnQuantity += item.refundableQuantity;
  });

  //页面初始化useEffect
  useEffect(() => {
    if (dataFetchedRef.current) {
      return;
    }
    dataFetchedRef.current = true;
    //sendPageEvent();
    console.log("order", order);
    const refunds = order.data.order.refunds;
    const returnNameSet = new Set();
    for (const refund of refunds) {
      returnNameSet.add(refund.returnName);
    }
    (async () => {
      const returnLineItems = await fetchReturnLineItem();
      console.log('Return line item:', returnLineItems);
      // 初始化 returnItems 为 products 里面的商品
      const tempItems = flineItems.slice();
      tempItems.forEach((item: any) => {
        for (var i = 0; i < returnLineItems.length; i++) {
          if (item.fulfillmentLineItemId.substring(34) == returnLineItems[i].FulfillmentLineItemId) {
            if (returnNameSet.has(returnLineItems[i].ReturnName)) {
              continue;
            }
            item.refundableQuantity -= returnLineItems[i].ReturnQuantity;
          }
        }
        if (item.refundableQuantity > 0) {
          for (const showItem of showUnReturnItems) {
            if (showItem.variantId == item.variantId) {
              showItem.refundableQuantity = item.quantity - item.refundableQuantity;
              break;
            }
          }
        }
      });
      for (const item of tempItems) {
        if (item.refundableQuantity <= 0) {
          console.log("item<0", item);
          //将item从tempItems中删除
          //  const index = tempItems.indexOf(item);
          //  tempItems.splice(index, 1);
          //遍历showUnReturnItems，将对应的item的refundableQuantity设置为item.quantity
          for (const showItem of showUnReturnItems) {
            if (showItem.variantId == item.variantId) {
              showItem.refundableQuantity = item.quantity;
              break;
            }
          }
        }
      }
      await setShowUnReturnItems(showUnReturnItems);
      await setProducts(tempItems);
      if (tempItems.length == 1) {
        // 如果只有一个商品，则默认选中
        setSelectedProducts({ [tempItems[0].variantId]: true });
      }
      const initialReturnItems = tempItems
      .filter((product: any) => product.refundableQuantity > 0)
      .map((product: any) => ({
        id: product.variantId,
        fulfillmentLineItemId: product.fulfillmentLineItemId,
        sku: product.sku,
        reason: '',
        subReason: '',
        returnQuantity: product.refundableQuantity,
        note: '',
        images: [],
      }));
      setReturnItems(initialReturnItems);
    })();
  }, []);

  useEffect(() => {
    // 每当 returnItems 发生变化时执行同步操作
    checkConditionA();
  }, [returnItems]);

  //缓冲圈
  const LoadingSpinner = () => (
    <div className="spinner">
      <div className="double-bounce1"></div>
      <div className="double-bounce2"></div>
    </div>
  );
  const [loading, setLoading] = useState(false);

  //发起请求获取orderId对应的可退款商品
  async function fetchReturnLineItem() {
    setLoading(true);
    try {
      const response = await fetch('https://ec2-18-118-198-174.us-east-2.compute.amazonaws.com:8443/v0.1/order/query_return_line_item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: 5937480007910,
        }),
      });
      const data = await response.json();
      return data.data.ReturnLineItemList;

    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }
  // fetchReturnLineItem();

  //以下判断条件，放到loader中进行判断
  // let unreturnProduct = unReturnItem;
  // //获取order使用的discount code列表
  // const discountCodes = order.data.order.discountApplications.edges.map((edge: any) => edge.node.code);
  // //获取order对应的fulfillment的event列表
  // const fulfillments = order.data.order.fulfillments.edges.map((edge: any) => edge.node);
  // const fulfillmentEvents = fulfillments.map((fulfillment: any) => fulfillment.events.nodes);
  // //判断条件1：获取discount code，如果code以AS开头，则全部商品不能自主退款
  // for (const code of discountCodes) {
  //   if (!discountCodes && code.startsWith('US')) {
  //     //unreturnProduct数组等于当前数组，加上products数组
  //     unreturnProduct = unreturnProduct
  //     products = [];
  //   }
  // }
  //todo: 判断条件2：获取fulfillment的status，如果status不含delivered，则去除
  // for (const events of fulfillmentEvents) {
  //   let check = false;
  //   for (const event of events) {
  //     if (event.status === 'DELIVERED') {
  //       check = true;
  //       break;
  //     }
  //   }
  //   if (!check) {
  //     unreturnProduct = products;
  //     products = [];
  //     break;
  //   }
  // }

  //metaObjects里面的每一项都是一个对象，对象里面有id,fields等属性，每个field里面有key,value
  //,reference等属性，请将key==dispalay_name 对于的value值以Return reason开头的metaObject提取出来
  const returnReasons = metaobjects.filter((metaobject: any) => metaobject.fields.some((field: any) => field.key == 'display_name' && field.value.startsWith('Return reason')));
  //新建一个hashmap，key为metaObject的id，value为metaObjectd的对象
  const metaObjectMap = new Map();
  metaobjects.forEach((metaObject: any) => {
    metaObjectMap.set(metaObject.id, metaObject);
  });
  const subReasonsMap = new Map();
  returnReasons.forEach((returnReason: any) => {
    //将returnReason.fields[2].value的值是一个json字符串，要将其变为一个json对象
    if (returnReason.fields[2] && returnReason.fields[2].key === 'sub_reason_list') {
      if (returnReason.fields[2].value.startsWith('[')) {
        subReasonsMap.set(returnReason.id, JSON.parse(returnReason.fields[2].value));
      }
      else {
        const subReasons = [];
        subReasons.push(returnReason.fields[2].value);
        subReasonsMap.set(returnReason.id, subReasons);
      }

    }
  });
  //新建一个hashmap,key为flineitem的variantId，value为flineitem的所有discountAllocation的allocatedAmount的amount的和
  const discountAllocationMap = new Map();
  flineItems.forEach((flineItem: any) => {
    let discountAmount = 0;
    flineItem.discountAllocations.forEach((discountAllocation: any) => {
      discountAmount += parseFloat(discountAllocation.allocatedAmount.amount);
    });
    discountAllocationMap.set(flineItem.variantId, discountAmount / flineItem.quantity);
  });

  //提示文字钩子
  const [showNoteWarning, setShowNoteWarning] = useState(false);
  const [showPhotoWarning, setShowPhotoWarning] = useState(false);
  const [selectedText, setSelectedText] = useState('please upload photos');

  // const handleSelectReason = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //   const divElement = event.target.parentElement;
  //   const productId = divElement?.id;

  //   //判断reason是否含有note和photo
  //   const reason = metaObjectMap.get(event.target.value);
  //   const noteElement = document.getElementById(`input-${productId}`) as HTMLInputElement;
  //   const photoElement = document.getElementById(`lable-file-input-${productId}`) as HTMLInputElement;
  //   noteElement.required = false;
  //   noteElement.placeholder = 'Note (optional)';
  //   //photoElement.innerHTML = 'Upload images (optional)';
  //   setShowNoteWarning(false);
  //   if (reason.fields.some((field: any) => field.key === 'require_note')) {
  //     if (noteElement) {
  //       noteElement.required = true;
  //       noteElement.placeholder = 'Note (required)';
  //       setShowNoteWarning(true);
  //     }
  //   }
  //   setShowPhotoWarning(false);
  //   if (reason.fields.some((field: any) => field.key === 'require_photo')) {
  //     if (photoElement) {
  //       //设置photoElement的title为require_photo的Upload images (required)
  //       //photoElement.innerHTML = 'Upload images (required)';
  //       setShowPhotoWarning(true);
  //     }
  //   }

  //   //每次改变reason，设置productID对应的returnItem的reason为选中的reason
  //   returnItems.map((returnItem: any) => {
  //     if (returnItem.id === productId) {
  //       returnItem.reason = reason.fields[1].value;
  //       returnItem.subReason = "";
  //     }
  //   });

  //   //设置divElement的data-reason-id属性为选中的reason的id
  //   divElement?.setAttribute('data-reason-id', event.target.value);
  //   const selectElement = document.getElementById(`select-${productId}`);
  //   const subReasons = subReasonsMap.get(event.target.value);
  //   const spanElement = document.getElementById(`span-${productId}`);
  //   spanElement!.style.display = 'inline';
  //   if (!subReasons || subReasons.length == 0) {
  //     spanElement!.style.display = 'none';
  //     selectElement?.setAttribute('hidden', 'true');
  //     checkConditionA();
  //     return;
  //   }
  //   //获取id=select-productId的select元素,并设置他显示
  //   selectElement?.removeAttribute('hidden');
  //   //设置这个select元素的option为选中的reason的subreason
  //   if (!selectElement) {
  //     return;
  //   }
  //   selectElement.innerHTML = '';
  //   const option = document.createElement('option');
  //   option.disabled = true;
  //   option.selected = true;
  //   option.text = 'Please select a sub reason';
  //   option.value = "0";
  //   selectElement?.appendChild(option);
  //   subReasons.forEach((subReason: any) => {
  //     const option = document.createElement('option');
  //     const reason = metaObjectMap.get(subReason);
  //     option.text = reason.fields.find((field: any) => field.key === 'reason')?.value;
  //     option.value = subReason;
  //     selectElement?.appendChild(option);
  //   });
  //   checkConditionA();
  // };
  // const handleSelectSubReason = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //   const divElement = event.target.parentElement;
  //   const productId = divElement?.id;
  //   //设置divElement的data-subreason-id属性为选中的subreason的id
  //   divElement?.setAttribute('data-subreason-id', event.target.value);
  //   const reason = metaObjectMap.get(event.target.value);
  //   const noteElement = document.getElementById(`input-${productId}`) as HTMLInputElement;
  //   const photoElement = document.getElementById(`lable-file-input-${productId}`) as HTMLInputElement;
  //   noteElement.required = false;
  //   noteElement.placeholder = 'Note (optional)';
  //   //photoElement.innerHTML = 'Upload images (optional)';
  //   setShowNoteWarning(false);
  //   if (reason.fields.some((field: any) => field.key === 'require_note')) {
  //     if (noteElement) {
  //       noteElement.required = true;
  //       noteElement.placeholder = 'Note (required)';
  //       setShowNoteWarning(true);
  //     }
  //   }
  //   setShowPhotoWarning(false);
  //   if (reason.fields.some((field: any) => field.key === 'require_photo')) {
  //     if (photoElement) {
  //       photoElement.required = true;
  //       //设置photoElement的title为require_photo的Upload images (required)
  //       //photoElement.innerHTML = 'Upload images (required)';
  //       setShowPhotoWarning(true);
  //     }
  //   }
  //   setSelectedText("");
  //   const firstSelectElement = document.getElementById(`1st-select-${productId}`);
  //   const firstSelectText = firstSelectElement!.options[firstSelectElement.selectedIndex].text;
  //   if (firstSelectText === 'Quality issue') {
  //     if (event.target.options[event.target.selectedIndex].text == "Damage/stain") {
  //       setSelectedText("Please upload photos of defective part");
  //     } else if (event.target.options[event.target.selectedIndex].text == "undone stiching") {
  //       setSelectedText("Please upload photos of defective part");
  //     } else if (event.target.options[event.target.selectedIndex].text == "Broken zipper/button..") {
  //       setSelectedText("Please upload photos for broken zipper issue");
  //     } else if (event.target.options[event.target.selectedIndex].text == "Other") {
  //       setSelectedText("Please upload photos of defective part");
  //     }
  //   }

  //   //每次改变reason，设置productID对应的returnItem的reason为选中的reason
  //   // returnItems.map((returnItem: any) => {
  //   //   if (returnItem.id === productId) {
  //   //     returnItem.subReason = reason.fields[1].value;
  //   //   }
  //   // });
  //   // checkConditionA();
  //   setReturnItems(prevReturnItems =>
  //     prevReturnItems.map((returnItem: any) => {
  //       if (returnItem.id === productId) {
  //         return { ...returnItem, subReason: reason.fields[1].value };
  //       }
  //       return returnItem;
  //     })
  //   );
  // }

  //file和photo的map
  const [fileHashMap, setFileHashMap] = useState(new Map());
  const [noteMap, setNoteMap] = useState(new Map());
  const [charCount, setCharCount] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    const newNoteMap = new Map(noteMap);
    const productId = event?.target?.getAttribute('data-product-id');
    newNoteMap.set(productId, event.target.value);
    setCharCount(event.target.value.length);
    setNoteMap(newNoteMap);
    //设置returnItems中对应的note为输入的note
    // returnItems.map((returnItem: any) => {
    //   if (returnItem.id === productId) {
    //     returnItem.note = event.target.value;
    //   }
    // });
    // checkConditionA();
    setReturnItems(prevReturnItems =>
      prevReturnItems.map((returnItem: any) => {
        if (returnItem.id === productId) {
          console.log("note", event.target.value);
          return { ...returnItem, note: event.target.value };
        }
        return returnItem;
      })
    );
  };

  const MAX_IMAGE_COUNT = 3;
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const [imageCounts, setImageCounts] = useState({}); // 初始化图片数量状态对象

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const prodcuctDiv = event?.target?.parentElement;
    const files = event.target.files;
    if(files!.length>1){
      alert("You can only select one image at a time.");
      event.target.value = '';
      return;
    }

    const productId = prodcuctDiv?.getAttribute('data-product-id');

    if (files) {
      const newSelectedImages = Array.from(files);
      const fileArr = fileHashMap.get(productId) || [];
      const totalImageCount = fileArr.length + newSelectedImages.length;

      if (totalImageCount > MAX_IMAGE_COUNT) {
        alert(`You can only select up to ${MAX_IMAGE_COUNT} images.`);
        event.target.value = '';
        return;
      }

      const oversizedImages = newSelectedImages.filter((image) => image.size > MAX_IMAGE_SIZE);
      if (oversizedImages.length > 0) {
        alert(`The selected images must be smaller than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`);
        event.target.value = '';
        return;
      }
      uploadImages(productId, files[0]);
      // fileArr.push(...newSelectedImages);
      // setFileHashMap((prev) => new Map(prev).set(productId, fileArr));
      //将returnItems中对应的filehashmap设置为fileArr
      // 更新 returnItems 中对应的 fileHashMap
      // const currentCount = imageCounts[productId] || 0;
      // const newImageCount = currentCount + newSelectedImages.length;

      // setImageCounts(prevCounts => ({
      //   ...prevCounts,
      //   [productId]: newImageCount
      // })); // 更新图片数量状态对象
      // setReturnItems(prevReturnItems =>
      //   prevReturnItems.map((returnItem: any) => {
      //     if (returnItem.id === productId) {
      //       return { ...returnItem, images: fileArr };
      //     }
      //     return returnItem;
      //   })
      // );

    }
    //checkConditionA();
    event.target.value = ''; // 重置文件输入元素的值
  };

  const cancelImageSelection = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    console.log("index", index);
    const target = event.target as HTMLButtonElement;
    const productDiv = target.parentElement;
    const productId = productDiv?.getAttribute('data-product-id');
    const fileArr = fileHashMap.get(productId) || [];
    if (fileArr.length != 0)
      fileArr.splice(index, 1);
    const currentCount = imageCounts[productId] || 0;
    const newImageCount = currentCount - 1;

    setImageCounts(prevCounts => ({
      ...prevCounts,
      [productId]: newImageCount
    })); // 更新图片数量状态对象
    setFileHashMap((prev) => new Map(prev).set(productId, fileArr));
    //将returnItems中对应的filehashmap设置为fileArr，使用setReturnItems来修改returnItems
    // returnItems.map((returnItem: any) => {
    //   if (returnItem.id === productId) {
    //     returnItem.images = fileArr;
    //   }
    // });
    setReturnItems(prevReturnItems =>
      prevReturnItems.map((returnItem: any) => {
        if (returnItem.id === productId) {
          return { ...returnItem, images: fileArr };
        }
        return returnItem;
      })
    );
  };

  const [isUploading, setIsUploading] = useState(false); // 控制提示框的显示
  const [uploadMessage, setUploadMessage] = useState('uploading...'); // 控制提示框的提示信息
  const uploadImages = async (productId, file) => {
    //判断file的后缀，如果不是png、jpg、jpeg，则不允许上传
    const validExtensions = ['image/png', 'image/jpg', 'image/jpeg'];
    if (!validExtensions.includes(file.type)) {
      alert('Only PNG,、JPG,、JPEG files are allowed.');
      return;
    }
    //获取文件的后缀名，并打印出来
    const suffix = file.name.split('.').pop();
    //获取文件的base64格式，并打印出来
    const shopifyOrderId = orderId.substring(20);
    // 创建 FileReader 实例
    const reader = new FileReader();

    // 读取文件并将其转换为 Data URL
    reader.readAsDataURL(file);

    // 等待文件读取完成
    await new Promise((resolve, reject) => {
      reader.onload = resolve;
      reader.onerror = reject;
    });
    // 获取读取结果，即 Base64 编码的字符串
    const base64String = reader.result.substring(reader.result.indexOf(',') + 1);

    //发起post请求，将base64string和shopifyOrderId和suffix以json格式传给后端url：ec2-18-118-198-174.us-east-2.compute.amazonaws.com:8080/v0.1/reviews/shopify_upload_img
    try {
      setIsUploading(true); // 显示提示框
      setUploadMessage('Uploading, plase wait...'); // 设置提示信息
      const response = await fetch('https://ec2-18-118-198-174.us-east-2.compute.amazonaws.com:8443/v0.3/order/shopify_upload_img', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          img_data: base64String,
          order_id: shopifyOrderId,
          suffix: suffix,
        }),
      });
      //打印response的返回数据载荷
      const data = await response.json();
      const imgSrc = "https://img.shopoases.com/" + data.data.result_path;
      console.log("Response data:", imgSrc);
      const fileArr = fileHashMap.get(productId) || [];
      fileArr.push(imgSrc);
      setFileHashMap((prev) => new Map(prev).set(productId, fileArr));
      //将returnItems中对应的filehashmap设置为fileArr
      // 更新 returnItems 中对应的 fileHashMap
      const currentCount = imageCounts[productId] || 0;
      const newImageCount = currentCount + 1;

      setImageCounts(prevCounts => ({
        ...prevCounts,
        [productId]: newImageCount
      })); // 更新图片数量状态对象
      setReturnItems(prevReturnItems =>
        prevReturnItems.map((returnItem: any) => {
          if (returnItem.id === productId) {
            return { ...returnItem, images: fileArr };
          }
          return returnItem;
        })
      );
      setUploadMessage('Upload successfullt.'); // 设置成功提示信息
    } catch (e) {
      console.log(e);
      setUploadMessage('UPload failed, please retry.');
    } finally {
      setTimeout(() => {
        setIsUploading(false); // 隐藏提示框
      }, 2000); // 延迟2秒后隐藏提示框
    }
  };

  //选择框逻辑
  const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: boolean }>({});
  useEffect(() => {
    checkConditionA();
  }, [selectedProducts]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    //如果checkboxchange取消选中，则将returnItems中对应的product id的returnItem的reason和subReason设置为空、note设置为空、images设置为空
    if (!event.target.checked) {
      setReturnItems(prevReturnItems =>
        prevReturnItems.map((returnItem: any) => {
          if (returnItem.id === productId) {
            return { ...returnItem, reason: '', subReason: '', note: '', images: [] };
          }
          return returnItem;
        })
      );
      //并且将fileHashMap中对应的product id的file设置为空
      const fileArr = fileHashMap.get(productId) || [];
      fileArr.splice(0, fileArr.length);
      setFileHashMap((prev) => new Map(prev).set(productId, fileArr));
    }
    setSelectedProducts({
      ...selectedProducts,
      [productId]: event.target.checked,
    });
    //checkConditionA();
  };

  //可退款数量输入框逻辑
  const [quantityMap, setQuantityMap] = useState(new Map());
  //勾选框提示文字钩子
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  function handleQuantityChange(event: React.ChangeEvent<HTMLInputElement>): void {
    //获取product id,等于该input元素的id
    const productId = event.target.id.substring(9, event.target.id.length);
    const newQuantityMap = quantityMap;
    let input = parseInt(event.target.value);
    if (event.target.value == "") {
      checkConditionA();
      setShowWarning(true);
      setWarningMessage(`*`);
      return;
    }
    //如果input超过了最大值max，则不允许输入，并return
    if (input > parseInt(event.target.max)) {
      checkConditionA();
      setShowWarning(true);
      setWarningMessage(`Input quantity out of range`);
      return;
    }
    setWarningMessage('');
    setShowWarning(false);
    newQuantityMap.set(productId, parseInt(event.target.value));
    setQuantityMap(newQuantityMap);
    //设置returnItems中对应的note为输入的note
    // returnItems.map((returnItem: any) => {
    //   if (returnItem.id === productId) {
    //     returnItem.returnQuantity = event.target.value;
    //   }
    // });
    setReturnItems(prevReturnItems =>
      prevReturnItems.map((returnItem: any) => {
        if (returnItem.id === productId) {
          return { ...returnItem, returnQuantity: event.target.value };
        }
        return returnItem;
      })
    );
    checkConditionA();
  }

  //控制页面浮动逻辑
  const [showNewPage, setShowNewPage] = useState(false);
  //控制退款选项框逻辑
  const [noneQuanlityHidden, setnoneQuanlityHidden] = useState(false);
  const [QuanlityHidden, setQuanlityHidden] = useState(false);
  //发送点击事件到kinesis
  const sendEvent = (pageName: string, eventName: string) => {
    console.log("Executing nextButtonEvent");
    // // 你的 refund 函数逻辑
    // AWS.config.update({
    //   region: 'us-east-2',
    //   credentials: new AWS.CognitoIdentityCredentials({
    //     IdentityPoolId: 'us-east-2:27577371-3612-4412-8534-76fbd47dc8aa',
    //   }),
    // });

    // // 检查凭证是否正确获取
    // AWS.config.credentials.get((err: any) => {
    //   if (err) {
    //     console.error('Error retrieving credentials:', err);
    //   } else {
    //     console.log('Successfully retrieved credentials:', AWS.config.credentials);
    //   }
    // });

    // // 初始化 AWS Kinesis 客户端
    // const kinesis = new AWS.Kinesis({
    //   apiVersion: '2013-12-02', // 替换为你的 API 版本
    // });

    // //获取当前设备
    // const userAgent = navigator.userAgent.toLowerCase();
    // const isMobile = /iphone|ipod|android|blackberry|opera mini|iemobile|mobile/i.test(userAgent);
    // const deviceType = isMobile ? 'web_pc' : 'web_m';

    // const data = {
    //   event: {
    //     page_name: `${pageName}`,
    //   },
    //   common: {
    //     email: `${customerEmail}`,
    //     platform: `${deviceType}`,
    //   },
    //   item_id: `${eventName}`,
    // };
    // // 生成凭证对象
    // const credentials = AWS.config.credentials;
    // const recordData = JSON.stringify(data);
    // // 设置 Kinesis 参数
    // const params = {
    //   Data: recordData,
    //   //Event: 'pageview',
    //   PartitionKey: `partition-${credentials!.identityId}`,
    //   StreamName: 'web-data-stream',
    // };

    // // 发送事件数据到 Kinesis
    // kinesis.putRecord(params, (err, data) => {
    //   if (err) {
    //     console.error('Error sending data to Kinesis:', err);
    //   } else {
    //     console.log('Successfully sent data to Kinesis:', data);
    //   }
    // });

  };
  const handleButtonClick = (event) => {
    event.preventDefault();
    //将按钮的文字设置为"Submit"
    event.target.textContent = showNewPage ? 'Next' : 'Submit';
    if (showNewPage == false) {
      sendEvent('prod_page_next_btn', 'return_click');
      setIsButtonDisabled(true);
      //获得选中的returnItems
      const filterReturnItems = returnItems.filter((returnItem: any) => selectedProducts[returnItem.id]);
      if (filterReturnItems.length == 0) {
        alert('Please select at least one item to return');
        return
      }
      //判断filterReturnItems中是否含有reason=='Quality issue'的returnItem，如果有，则把"none-quanlity-select"隐藏，如果没有，则显示
      const qualityIssue = filterReturnItems.find((returnItem: any) => returnItem.reason !== 'Quality issue');
      if (qualityIssue) {
        setnoneQuanlityHidden(false);
      }
      else {
        setnoneQuanlityHidden(true);
      }
      //判断filterReturnItems中是否含有reason!='Quality issue'的returnItem，如果有，则把"quanlity-select"隐藏，如果没有，则显示
      const noneQualityIssue = filterReturnItems.find((returnItem: any) => returnItem.reason === 'Quality issue');
      if (noneQualityIssue) {
        setQuanlityHidden(false);
      }
      else {
        setQuanlityHidden(true);
      }

      for (const item of filterReturnItems) {
        if (item.reason === '') {
          alert(`Please select a return reason`);
          return;
        }
        //遍历metaObjects中，fields[1].value为item.reason的metaObject
        const reason = metaobjects.find((metaObject: any) => metaObject.fields[1].value === item.reason);
        if (item.subReason === '' && reason.fields[2].key === 'sub_reason_list') {
          alert(`Please select a sub reason`);
          return;
        }
        if (reason && reason.fields.some((field: any) => field.key === 'require_photo') && item.images.length === 0) {
          alert(`Please upload images`);
          return;
        }

        //遍历metaObjects中，fields[1].value为item.subReason或者为item.reason的metaObject
        const subReason = metaobjects.find((metaObject: any) => metaObject.fields[1].value === item.subReason);
        if (subReason && subReason.fields.some((field: any) => field.key === 'require_photo') && item.images.length === 0) {
          alert(`Please upload images`);
          return;
        }
      }
      setShowNewPage(true);
    }
    else {
      //发送事件到kinesis
      sendEvent('refund_type_submit_btn', 'return_click');
      //调用submit函数 
      submit();
    }
  };

  const [qualityType, setQualityType] = useState(0);
  const [noneQualityType, setNoneQualityType] = useState(0);
  //submit函数，submit退款商品的逻辑
  const submit = async () => {
    //将所有复选框没有选中的product id对应的returnItem删除于returnItems
    const filterReturnItems = returnItems.filter((returnItem: any) => selectedProducts[returnItem.id]);
    console.log('RETURN ITEMS:', filterReturnItems);
    const result = {
      shopify_order_id: Number(orderId.substring(20)),
      quality_type: qualityType,
      none_quality_type: noneQualityType,
      return_cash: parseFloat(myFixed(noneCashAmount + quanlityCashAmount, 2)),
      store_credit: parseFloat(myFixed(noneStoreCreditAmount + quanlityStoreCreditAmount, 2)),
      currency_code: "USD",
      source: 1,
      return_lineitem_list: filterReturnItems.map((returnItem) => {
        return {
          fulfillment_lineitem_id: Number(returnItem.fulfillmentLineItemId.substring(34)),
          variant_id: Number(returnItem.id.substring(29)),
          shopify_order_id: Number(orderId.substring(20)),
          sku: returnItem.sku,
          return_quantity: Number(returnItem.returnQuantity),
          reason: returnItem.reason,
          sub_reason: returnItem.subReason,
          note: returnItem.note,
          img_list: returnItem.images,
        };
      }),
    };
    const riJson = JSON.stringify(result, null, 2);
    console.log('RETURN ITEMS JSON:', riJson);
    //发起post请求，将returnItemsJson以json格式传给后端url：ec2-18-118-198-174.us-east-2.compute.amazonaws.com:8080/v0.1/reviews/shopify_return
    try {
      setIsUploading(true); // 显示提示框
      setUploadMessage('Submitting, plase wait...'); // 设置提示信息
      const response = await fetch('https://ec2-18-118-198-174.us-east-2.compute.amazonaws.com:8443/v0.1/order/create_return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: riJson,
      });
      const data = await response.json();
      console.log(data);
      //更改提示框的文字为"Submit successfully"
      setIsUploading(false); // 隐藏提示框
      alert('Submit successfully');
      window.location.href = 'https://example.com';
    } catch (e) {
      console.log(e);
      setIsUploading(false); // 隐藏提示框
      //延迟两秒后隐藏提示框
      //显示一个弹窗，提示用户提交失败，有两个按钮，一个是ok，停留在当前界面，一个是back，返回到order status界面
      const result = window.confirm('Submit failed, please retry.');
      if (result) {
        return;
      }
      else {
        window
          .location
          .href = `https://shopify.com/61449994470/account/orders/${orderId.substring(20)}`;
      }
    }
  };

  const handleButtonBack = (event) => {
    if (showNewPage) {
      sendEvent('refund_type_back_btn', 'return_click');
      setFirstSelectValue('');
      setSecondSelectValue('');
      setShowNewPage(false);
      setIsButtonDisabled(false);
      const nextButton = document.getElementById('next-button');
      if (nextButton) {
        nextButton.textContent = 'Next';
      }
    } else {
      sendEvent('prod_page_cancel_btn', 'return_click');
      window.location.href = `https://shopify.com/61449994470/account/orders/${orderId.substring(20)}`;
    }
  }

  const handleButtonCancel = (event) => {
    sendEvent('prod_page_cancel_btn', 'return_click');
    window.location.href = `https://shopify.com/61449994470/account/orders/${orderId.substring(20)}`;
  }

  //设置两个amount，一个是cashAmount，一个是storeCreditAmount
  const [noneCashAmount, setNoneCashAmount] = useState(0);
  const [quanlityCashAmount, setQuanlityCashAmount] = useState(0);
  const [noneStoreCreditAmount, setNoneStoreCreditAmount] = useState(0);
  const [quanlityStoreCreditAmount, setQuanlityStoreCreditAmount] = useState(0);

  //判断是否选择select
  const [firstSelectValue, setFirstSelectValue] = useState('');
  const [secondSelectValue, setSecondSelectValue] = useState('');

  //退款方式处理
  const handleRadioChange = (event) => {
    //将所有复选框没有选中的product id对应的returnItem删除于returnItems
    const filterReturnItems = returnItems.filter((returnItem: any) => selectedProducts[returnItem.id]);
    const type = event.target.value;
    console.log('type:', type);
    if (type === 'non-quality-sc') {
      setFirstSelectValue(event.target.value);
      setNoneQualityType(2);
      //设置cashAmount为所有退款商品的价格的100%和
      let totalAmount = 0;
      //遍历所有原因不等于"Quality Issue"的returnItem
      filterReturnItems.forEach((returnItem: any) => {
        if (returnItem.reason !== 'Quality issue') {
          //price等于products中variantid等于returnItem.id的price减去discountAllocationMap中的值
          const price = products.find((product: any) => product.variantId === returnItem.id).price.amount - discountAllocationMap.get(returnItem.id);
          totalAmount += returnItem.returnQuantity * (price);
        }
      });
      setNoneCashAmount(0);
      setNoneStoreCreditAmount(totalAmount);
    } else if (type === 'non-quality-cash') {
      setFirstSelectValue(event.target.value);
      setNoneQualityType(1);
      //设置cashAmount为所有退款商品的价格的50%和
      let totalAmount = 0;
      filterReturnItems.forEach((returnItem: any) => {
        if (returnItem.reason !== 'Quality issue') {
          //price等于products中variantid等于returnItem.id的price减去discountAllocationMap中的值
          const price = products.find((product: any) => product.variantId === returnItem.id).price.amount - discountAllocationMap.get(returnItem.id);
          totalAmount += returnItem.returnQuantity * (price);
        }
      });
      setNoneCashAmount(totalAmount / 2);
      setNoneStoreCreditAmount(0);
    }
    if (type === 'quality-sc') {
      setSecondSelectValue(event.target.value);
      setQualityType(2);
      //设置cashAmount为所有退款商品的价格的110%和
      let totalAmount = 0;
      filterReturnItems.forEach((returnItem: any) => {
        if (returnItem.reason === 'Quality issue') {
          //price等于products中variantid等于returnItem.id的price减去discountAllocationMap中的值
          const price = products.find((product: any) => product.variantId === returnItem.id).price.amount - discountAllocationMap.get(returnItem.id);
          totalAmount += returnItem.returnQuantity * (price);
        }
      });
      setQuanlityCashAmount(0);
      setQuanlityStoreCreditAmount(totalAmount * 1.1);
    } else if (type === 'quality-cash') {
      setQualityType(1);
      setSecondSelectValue(event.target.value);
      //设置cashAmount为所有退款商品的价格的100%和
      let totalAmount = 0;
      filterReturnItems.forEach((returnItem: any) => {
        if (returnItem.reason === 'Quality issue') {
          //price等于products中variantid等于returnItem.id的price减去discountAllocationMap中的值
          const price = products.find((product: any) => product.variantId === returnItem.id).price.amount - discountAllocationMap.get(returnItem.id);
          totalAmount += returnItem.returnQuantity * (price);
        }
      });
      setQuanlityCashAmount(totalAmount);
      setQuanlityStoreCreditAmount(0);
    }
    const selectElement1 = document.getElementById('returnMethod-noneQuantity') as HTMLSelectElement;
    const selectElement2 = document.getElementById('returnMethod-quantity') as HTMLSelectElement;
    if (!noneQuanlityHidden && !QuanlityHidden) {
      if (selectElement1.value != '0' && selectElement2.value != '0') {
        setIsButtonDisabled(false);
      }
    } else if (!noneQuanlityHidden && QuanlityHidden) {
      if (selectElement1.value != '0') {
        setIsButtonDisabled(false);
      }
    } else if (noneQuanlityHidden && !QuanlityHidden) {
      if (selectElement2.value != '0') {
        setIsButtonDisabled(false);
      }
    }
  };

  //是否满足条件next条件判断
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  //next的条件判断
  const checkConditionA = () => {
    console.log("enter checkConditionA");
    // 判断条件A是否满足的逻辑
    // 这里假设条件A是某个状态变量为true
    let check = true;
    const filterReturnItems = returnItems.filter((returnItem: any) => selectedProducts[returnItem.id]);
    console.log("fl:", filterReturnItems);
    console.log("fl:", returnItems);
    if (filterReturnItems.length == 0) {
      check = false;
    }
    for (const item of filterReturnItems) {
      //提示超过最大数量
      if (showWarning) {
        check = false;
        break;
      }

      //未选择原因
      if (item.reason === '') {
        check = false;
        break;
      }
      //未选择子原因，遍历metaObjects中，fields[1].value为item.reason的metaObject
      const reason = metaobjects.find((metaObject: any) => metaObject.fields[1].value === item.reason);
      if (item.subReason === '' && reason.fields[2].key === 'sub_reason_list') {
        check = false;
        break;
      }
      //未上传图片
      if (reason && reason.fields.some((field: any) => field.key === 'require_photo') && item.images.length === 0) {
        check = false;
        break;
      }
      //遍历metaObjects中，fields[1].value为item.subReason或者为item.reason的metaObject
      const subReason = metaobjects.find((metaObject: any) => metaObject.fields[1].value === item.subReason);
      if (subReason && subReason.fields.some((field: any) => field.key === 'require_photo') && item.images.length === 0) {
        check = false;
        break;
      }

      //未填写note的判断条件
      if (reason && reason.fields.some((field: any) => field.key === 'require_note') && item.note.length === 0) {
        console.log("111", item.note.length);
        check = false;
        break;
      }
      if (subReason && subReason.fields.some((field: any) => field.key === 'require_note') && item.note.length === 0) {
        check = false;
        break;
      }

    }
    if (check) {
      setIsButtonDisabled(false);
      console.log('RETURN ITEMS:', filterReturnItems);
    } else {
      setIsButtonDisabled(true);
    }
  };
  //遍历returnReasons存入options，value和lable都是returnReasons的项的id，children是subReasonsMap中的项
  const options = returnReasons.map((returnReason) => {
    return {
      value: returnReason.id,
      label: returnReason.fields[1].value,
      //如果subReasonsMap中没有，则没有children,否则有children
      children: subReasonsMap.get(returnReason.id) ? subReasonsMap.get(returnReason.id).map((subReason) => {
        return {
          value: metaObjectMap.get(subReason).id,
          label: metaObjectMap.get(subReason).fields.find((field: any) => field.key === 'reason')?.value,
        };
      }) : null,
    };
  });

  const [cascaderMap, setCascaderMap] = useState(new Map());
  const handleCascaderChange = (value, id) => {
    console.log('Selected value:', value);
    console.log('Cascader ID:', id);
    const productId = id;

    cascaderMap.set(productId, value);
    setCascaderMap(new Map(cascaderMap));

    //判断reason是否含有note和photo
    const reason = metaObjectMap.get(value[0]);
    let subReason: any = null;
    if (reason.fields[1]) {
      subReason = metaObjectMap.get(value[1]);
    }
    const noteElement = document.getElementById(`input-${productId}`) as HTMLInputElement;
    const photoElement = document.getElementById(`lable-file-input-${productId}`) as HTMLInputElement;
    noteElement.required = false;
    noteElement.placeholder = 'Note (optional)';
    //photoElement.innerHTML = 'Upload images (optional)';
    setShowNoteWarning(false);
    if (reason.fields.some((field: any) => field.key === 'require_note')) {
      if (noteElement) {
        noteElement.required = true;
        noteElement.placeholder = 'Note (required)';
        setShowNoteWarning(true);
      }
    }
    if (subReason && subReason.fields.some((field: any) => field.key === 'require_note')) {
      if (noteElement) {
        noteElement.required = true;
        noteElement.placeholder = 'Note (required)';
        setShowNoteWarning(true);
      }
    }
    setShowPhotoWarning(false);
    if (reason.fields.some((field: any) => field.key === 'require_photo')) {
      if (photoElement) {
        //设置photoElement的title为require_photo的Upload images (required)
        //photoElement.innerHTML = 'Upload images (required)';
        setShowPhotoWarning(true);
      }
    }
    if (subReason && subReason.fields.some((field: any) => field.key === 'require_photo')) {
      if (photoElement) {
        //设置photoElement的title为require_photo的Upload images (required)
        //photoElement.innerHTML = 'Upload images (required)';
        setShowPhotoWarning(true);
      }
      if (reason.fields[1].value === 'Quality issue') {
        if (subReason.fields[1].value == "Damage/stain") {
          setSelectedText("Please upload photos of defective part");
        } else if (subReason.fields[1].value == "undone stiching") {
          setSelectedText("Please upload photos of defective part");
        } else if (subReason.fields[1].value == "Broken zipper/button..") {
          setSelectedText("Please upload photos for broken zipper issue");
        } else if (subReason.fields[1].value == "Other") {
          setSelectedText("Please upload photos of defective part");
        }
      }
    }
    //每次改变reason，设置productID对应的returnItem的reason为选中的reason
    returnItems.map((returnItem: any) => {
      if (returnItem.id === productId) {
        returnItem.reason = reason.fields[1].value;
        returnItem.subReason = subReason ? subReason.fields[1].value : '';
      }
    });
    checkConditionA();
  };

  return (
    <div className="mt-0 mb-0 ml-0 mr-0 min-h-screen p-0 ">
      <div>
        <nav className=" bg-white p-4 shadow-lg">
          <div className="container
           mx-auto flex justify-between items-center">
            <div className="text-black text-lg font-semibold">
              Commense
            </div>
            <div className="space-x-4">
              <a style={{ fontSize: '14px' }} href="https://shopify.com/61449994470/account/orders" className="text-black hover:text-gray-200 mr-4">Orders</a>
              <a style={{ fontSize: '14px' }} href="https://au.thecommense.com" className="text-black hover:text-gray-200">Store</a>
            </div>
          </div>
        </nav>
        {isUploading && (
          <div className="uploading-overlay">
            <div className="uploading-message">{uploadMessage}</div>
          </div>
        )}
      </div>
      {showNewPage ? (
        <div>
          <h1 className='mt-4 mb-4 ml-6 flex items-center'><IoMdArrowBack onClick={handleButtonBack} />&nbsp;Select refund type</h1>
          <p className='ml-6 mb-3'>please <a href="mailto:service@thecommense.com" className="text-blue-500 hover:underline"
            onClick={() => sendEvent('refund_type_contact_us', 'return_click')}
          >contact us</a> if neither of the refund options works for you.</p>
          <div className="container1">
            <div className='item'>
              {!noneQuanlityHidden && (
                <div id="none-quanlity-select" className='ml-6'>
                  <h2 style={{ fontSize: '16px' }}>For item(s) of non-quality issue:</h2>
                  <div className="flex items-center">
                    <select
                      id="returnMethod-noneQuantity"
                      name="returnMethod-noneQuantity"
                      onChange={handleRadioChange}
                      className="mt-0 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      style={{ width: '100%', height: '60px', whiteSpace: 'normal', backgroundColor: 'white' }}
                      defaultValue="0"
                    >
                      <option value="0" disabled >Please select a refund type</option>
                      <option value="non-quality-sc" style={{ whiteSpace: 'normal' }}>
                        Keep the item(s), a store credit of 100% product amount
                      </option>
                      <option value="non-quality-cash" style={{ whiteSpace: 'normal' }}>
                        Keep the item(s), returned 50% cash of the product amount
                      </option>
                    </select>
                    <span className="ml-2 text-red-300">*</span>
                  </div>
                </div>)}
              {!QuanlityHidden && (
                <div id="quanlity-select" className='ml-6'>
                  <h2 style={{ fontSize: '16px' }}>For item(s) of quality issue:</h2>
                  <div className="flex items-center">
                    <select
                      id="returnMethod-quantity"
                      name="returnMethod-quantity"
                      onChange={handleRadioChange}
                      className="mt-0 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      style={{ width: '100%', height: '60px', whiteSpace: 'normal', backgroundColor: 'white' }}
                    >
                      <option value="0" disabled selected>Please select a refund type</option>
                      <option value="quality-sc" style={{ whiteSpace: 'normal' }}>
                        Keep the item(s), a store credit of 110% product amount
                      </option>
                      <option value="quality-cash" style={{ whiteSpace: 'normal' }}>
                        Full cash refund
                      </option>
                    </select>
                    <span className="ml-2 text-red-300">*</span>
                  </div>
                </div>)}
              <div style={{ height: '6px' }}></div>
            </div>
            {(firstSelectValue || secondSelectValue) && (
              <div className="item mt-1 ml-6" style={{ width: '85%' }}>
                <h2>Estimate total amount:</h2>
                <div className="mt-4 p-4 bg-white border border-gray-300 rounded-lg shadow-sm"
                  style={{ width: '110%' }}>
                  {(noneStoreCreditAmount + quanlityStoreCreditAmount) > 0 && (
                    <h3 style={{ fontSize: '14px' }} className="font-semibold">Total refund store credit: &nbsp;{myFixed(noneStoreCreditAmount + quanlityStoreCreditAmount, 2)}$</h3>
                  )}
                  {(noneCashAmount + quanlityCashAmount) > 0 && (
                    <h3 style={{ fontSize: '14px' }} className="font-semibold">Total refund cash:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      {myFixed(noneCashAmount + quanlityCashAmount, 2)}$</h3>)}
                  {/* <button className="py-1 px-2 bg-blue-500 text-white rounded-lg shadow-sm"
                    type='submit'
                  >
                    Submit
                  </button> */}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        //请将这个metaObject最为下拉框的选项，加入到下面的前端中的product项的下面
        <div>
          <div>
            <h1 className='mt-4 mb-4 ml-6 flex items-center'><IoMdArrowBack onClick={handleButtonBack} />&nbsp;Request return</h1>
            <p className='ml-6'>Learn about our <a href="https://thecommense.com/pages/return-policy-commense" className="text-blue-500 hover:underline"
              onClick={() => sendEvent('prod_page_refund_policy', 'return_click')}
            >refund policy</a>. If you have any questions, <a href="mailto:service@thecommense.com" className="text-blue-500 hover:underline"
              onClick={() => sendEvent('prod_page_contact_us', 'return_click')}
            >contact us</a>.</p>
          </div>
          <div className="container1"
          >
            <div className=" mb-3 mr-4" style={{ width: '100%' }}>
              <div className="item ml-6 mt-3 mb-3 bg-white rounded-lg border border-gray-300"
                style={{ width: '100%' }}
              >
                <div style={{height: '6px'}}></div>
                {loading && <LoadingSpinner />}
                {products
                .filter((product: any) => product.refundableQuantity > 0)
                .map((product: any, index: number) => (
                  <div key={index} className="flex flex-col space-y-2 mb-4 ">
                    <div className='flex flex-row space-x-4'>
                      {products.length > 1 && (
                        <div className='ml-4 mt-7 mr-1'><input id={`check-${product.variantId}`} type="checkbox"
                          checked={!!selectedProducts[product.variantId]}
                          onChange={(event) => handleCheckboxChange(event, product.variantId)} />
                        </div>)}
                      {products.length == 1 && (
                        <div className='ml-4 mt-7 mr-1'>
                        </div>)}
                      <div style={{ padding: '0', margin: '0' }}>
                        <img className='mr-8' src={product.image.url} alt={product.title} style={{ width: '60px', height: '80px' }} />
                      </div>
                      <div className='ml-2'>
                        <p className=" mb-0 mr-2" style={{ fontSize: '14px' }}>{product.title}</p>
                        <div className="product-details">
                          <p className="mt-1" style={{ color: 'gray', fontSize: '12px', float: 'left' }}>{product.variantTitle}</p>
                          <p className="mt-1 mr-2" style={{ float: 'right', fontSize: '12px' }}> {product.refundableQuantity} * ${myFixed(product.price.amount - discountAllocationMap.get(product.variantId), 2)}</p>
                        </div>
                        {product.productType == "matching set" && (
                          <p className=" mb-0 mr-2" style={{ fontSize: '12px', color: "red" }}>The matching set cannot be refunded separately</p>
                        )}
                      </div>
                    </div>
                    {selectedProducts[product.variantId] && (<div id={product.variantId} data-reason-id="0" data-subreason-id='0'>
                      {product.refundableQuantity > 1 && (
                        <div className="input-with-label">
                          <span className="label">quantity</span>
                          <input
                            required
                            style={{ width: '50px', height: '50px',paddingBottom: '0px' }}
                            id={`quantity-${product.variantId}`}
                            type="number"
                            defaultValue={quantityMap.get(product.variantId) || product.refundableQuantity}
                            min="1"
                            step={1}
                            max={product.refundableQuantity}
                            onChange={handleQuantityChange}
                            className="ml-4 py-1 mb-0 px-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {showWarning && (
                            <span className="ml-2 mb-0 text-red-500 text-xs">{warningMessage}</span>
                          )}
                        </div>
                      )}
                      <Cascader
                        id={`cascader-${product.variantId}`}
                        onChange={(value) => handleCascaderChange(value, product.variantId)}
                        options={options}
                        placeholder="Please select return reason"
                        style={{ width: '250px', height: '30px' }}
                        className='ml-4 mt-0.5'
                        value={cascaderMap.get(product.variantId) || []}>
                      </Cascader>
                      <span id={`span-${product.variantId}`} className="ml-2 text-red-400">*</span>
                      {/* <select 
                      id={`1st-select-${product.variantId}`}
                      onChange={(event) => handleSelectReason(event)}
                      style={{ width: '250px', height: '30px' }}
                      className='ml-4 mt-0.5 py-1 px-2 text-gray-700 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500'>
                      <option value="0" disabled selected>Please select a return reason</option>
                      {returnReasons.map((reason: any) => (
                        <option key={reason.id} value={reason.id}>
                          {reason.fields.find((field: any) => field.key === 'reason')?.value}
                        </option>
                      ))}
                    </select>
                    <span className="ml-2 text-red-300">*</span>
                    <select id={`select-${product.variantId}`} hidden onChange={handleSelectSubReason}
                      style={{ width: '250px', height: '30px' }}
                      className='ml-4 mt-0.5 py-1 px-2 text-gray-700 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500'>
                    </select> */}

                      <div style={{ position: 'relative', width: '250px' }}>
                        <TextareaAutosize
                          id={`input-${product.variantId}`}
                          style={{
                            width: '100%',
                            resize: 'none',
                            overflow: 'hidden',
                            paddingBottom: '20px' // 为字符计数器留出空间
                          }}
                          data-product-id={product.variantId}
                          maxLength={500}
                          placeholder="Note (optional)"
                          value={noteMap.get(product.variantId) || ''}
                          onChange={handleInputChange}
                          className="ml-4 mt-0.5 mb-0 py-1 px-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div style={{ position: 'absolute', fontSize: '12px', color: 'gray', right: '0px' }}>
                          {charCount}/500
                          {showNoteWarning && (
                            <span className="ml-2 mt-0.5 mb-0 text-red-500">*</span>
                          )}
                        </div>

                      </div>
                      <div className="mt-0.5 flex items-center" data-product-id={product.variantId}>
                        <input
                          id={`file-input-${product.variantId}`}
                          hidden
                          type="file"
                          accept="image/*"
                          title='Upload your images'
                          onChange={handleImageChange}
                          className="py-1 px-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          multiple // Allow multiple file selection
                        />
                        <div className="ml-4 py-1 px-2 " style={{ border: '1px dashed #ccc', padding: '0' }}>
                          <label id={`lable-file-input-${product.variantId}`} htmlFor={`file-input-${product.variantId}`}
                            style={{
                              width: '50px',
                              height: '50px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                            <MdOutlineAddPhotoAlternate />
                            <p style={{ fontSize: '10px' }}>Photos</p>
                            <p style={{ fontSize: '10px' }}>({imageCounts[product.variantId] || 0}/3)</p>
                          </label>
                        </div>
                        {/* <div id={`lable-file-input-${product.variantId}`} htmlFor={`file-input-${product.variantId}`}>
                        Upload images (optional)
                        </div> */}
                        {showPhotoWarning && (
                          <span className="ml-2 text-red-400">*</span>
                        )}
                        <div className="mt-0.5 flex items-center ml-4">
                          {fileHashMap.get(product.variantId)?.map((image: string, index: number) => (
                            <div data-product-id={product.variantId} key={index} className="flex flex-col">
                              <img src={image} alt={`Preview ${index}`} className="mr-2 w-36 h-48" style={{ width: '36px', height: '48px' }} />
                              <button
                                onClick={(event) => cancelImageSelection(event, index)}
                                className=" ml-2.5  bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                style={{ width: '15px', height: '15px', padding: '0', lineHeight: '15px' }}
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      {showPhotoWarning && (
                        <p className="ml-4" style={{ fontSize: '10px', color: 'red' }}>{selectedText}</p>
                      )}
                    </div>)}
                  </div>
                ))}
              </div>
              <div className="margin-desktop-only" style={{ height: '100px' }}></div>
            </div>
            {showUnReturnItems.length > 0 && (<div className="item ml-6 mt-3 mb-3 rounded-lg border border-gray-300"
              style={{ width: '100%' }}
            >
              <h3 className='ml-4 mb-2 mt-2'>{totalUnreturnQuantity} items in this order aren't eligible for return.</h3>
              {showUnReturnItems.map((product: any, index: number) => (
                <div key={index} className="flex flex-col space-y-2 ">
                  <div className='flex flex-row space-x-4 mb-4'>
                    <div className='ml-4 mt-7 mr-1'><input id={`check-${product.variantId}`} type="checkbox"
                      checked={!!selectedProducts[product.variantId]}
                      onChange={(event) => handleCheckboxChange(event, product.variantId)}
                      style={{ visibility: 'hidden' }} />
                    </div>
                    <div style={{ padding: '0', margin: '0' }}>
                      <img className="mr-2" src={product.image.url} alt={product.title} style={{ width: '60px', height: '80px' }} />
                    </div>
                    <div className='ml-2'>
                      <p className="mr-2" style={{ fontSize: '14px' }}>{product.title}</p>
                      <p className="mt-1" style={{ color: 'gray', fontSize: '12px' }}>{product.variantTitle}</p>
                      <p className="mt-1" style={{ color: 'gray', fontSize: '12px' }}>{product.refundableQuantity} items</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>)}
            <div style={{ height: '100px' }}></div>
          </div >
        </div>
      )}
      {/* 浮动按钮 */}
      <div>
        <button
          onClick={handleButtonClick}
          className={`fixed bottom-16 right-4 rounded-md p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 ${isButtonDisabled ?
            'bg-gray-500 text-gray-300 cursor-not-allowed focus:ring-gray-500' : 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500'
            } custom-button`}
          disabled={isButtonDisabled}
          id='next-button'
        >
          Next
        </button>
        <button
          id='back-button'
          onClick={handleButtonCancel}
          className={`fixed bottom-4 right-4 rounded-md p-2 shadow-lg focus:outline-none 
            focus:ring-2 focus:ring-opacity-50 
              bg-white text-back hover:bg-blue-500 focus:ring-blue-500 custom-button`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
function myFixed(val: number, num: number) {
  val = parseFloat(val.toFixed(num + 1));
  let multiplier = Math.pow(10, num);
  val = Math.ceil(val * multiplier) / multiplier;
  return val.toFixed(num);
}
export async function loader({ params, context }: { params: any, context: LoaderFunctionArgs }) {
  console.log(context.env.secretKey);
  const key = context.env.secretKey;
  //   const { data, errors } = await context.customerAccount.mutate<{
  //     // customer: { firstName: string; lastName: string };
  //   }>(`#graphql
  // mutation storefrontCustomerAccessTokenCreate {
  //   storefrontCustomerAccessTokenCreate {
  //     customerAccessToken
  //     userErrors {
  //       field
  //       message
  //     }
  //   }
  // }
  //         `);
  //   const token = data.storefrontCustomerAccessTokenCreate.customerAccessToken;
  //   if (errors?.length || !data?.storefrontCustomerAccessTokenCreate) {
  //     throw new Error('Customer not found');
  //   }
  const orderId = `gid://shopify/Order/${params.orderId}`;

  //根据orderId查找订单信息
  const order = await context.customerAccount.query(`#graphql
     query getOrder($orderId: ID!) {
         order(id: $orderId) {
            id
            name
            email
            refunds{
              createdAt
              returnName
            }
            discountApplications(first:10){
              edges{
                node{
                  ... on DiscountCodeApplication{
                    code
                  }
                }
              }
            }
            fulfillments(first:250){
                edges{
                    node{
                        id
                        events(first:30){
                          nodes{
                            id
                            status
                            happenedAt
                          }
                        }
                        fulfillmentLineItems(first:250){
                            pageInfo {
                              hasNextPage
                              endCursor
                            }
                            edges{
                                node{
                                    id
                                    quantity
                                    lineItem{
                                      image{
                                        url
                                      }
                                      sku
                                      title
                                      variantTitle
                                      variantId
                                      productId
                                      productType
                                      refundableQuantity
                                      quantity
                                      totalPrice{
                                        amount
                                      }
                                      discountAllocations{
                                        allocatedAmount{
                                          amount
                                        }
                                      }
                                      price{
                                        amount
                                      }
                                    }
                                }
                            }
                        }
                    }
                }
            }
         }
      }
      `, {
    variables: {
      orderId
    }
  });

  //如果有fulfillment超过250，开始查询
  // const fulfillment = order.data.order.fulfillments.edges.map((edge: any) => edge.node);
  // for (const f of fulfillment) {
  //   if (f.fulfillmentLineItems.pageInfo.hasNextPage) {
  //     const fulfillmentLineItems = await context.customerAccount.query(`#graphql
  //     query getFulfillmentLineItems($fulfillmentId: ID!, $endCursor: String) {
  //       fulfillment(id: $fulfillmentId) {
  //         fulfillmentLineItems(first: 250, after: $endCursor) {
  //           pageInfo {
  //             hasNextPage
  //             endCursor
  //           }
  //           edges {
  //             node {
  //               id
  //               quantity
  //               lineItem {
  //                 image {
  //                   url
  //                 }
  //                 sku
  //                 title
  //                 variantTitle
  //                 variantId
  //                 productId
  //                 productType
  //                 refundableQuantity
  //                 quantity
  //                 totalPrice {
  //                   amount
  //                 }
  //                 discountAllocations {
  //                   allocatedAmount {
  //                     amount
  //                   }
  //                 }
  //                 price {
  //                   amount
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //     `, {
  //       variables: {
  //         fulfillmentId: f.id,
  //         endCursor: f.fulfillmentLineItems.pageInfo.endCursor
  //       }
  //     });
  //     f.fulfillmentLineItems.edges.push(...fulfillmentLineItems.fulfillment.fulfillmentLineItems.edges);
  //   }
  // }

  // //lineItems为所有fulfillment的lineItems
  // let flineItems = order.data.order.fulfillments.edges.map((edge: any) => edge.node.fulfillmentLineItems.edges.map((edge: any) => edge.node.lineItem));
  // //将flineItems转为一维数组
  // flineItems = flineItems.flat();

  let flineItems = order.data.order.fulfillments.edges.map((edge: any) => {
    return edge.node.fulfillmentLineItems.edges.map((lineItemEdge: any) => {
      // 创建一个新的对象，包含原始 lineItem 的所有字段和新字段
      let newItem = { ...lineItemEdge.node.lineItem };
      newItem.fulfillmentLineItemId = lineItemEdge.node.id; // 添加新字段并赋值
      return newItem;
    });
  }).flat();

  const response = await context.storefront.query(`#graphql
        query getmetaObjects {
  metaobjects(type: "return_reason_item", first: 30) {
    edges {
      node {
        id
        fields {
          key
          value
          reference {
            ... on Metaobject {
              id
              type
            }
          }
        }
      }
    }
  }
}
         `);
  //进行AS-code和履约日期的筛选
  let unReturnItem = [];
  //获取order使用的discount code列表
  const discountCodes = order.data.order.discountApplications.edges.map((edge: any) => edge.node.code);
  //获取order对应的fulfillment的event列表
  const fulfillments = order.data.order.fulfillments.edges.map((edge: any) => edge.node);
  const fulfillmentEvents = fulfillments.map((fulfillment: any) => fulfillment.events.nodes);
  //判断条件1：获取discount code，如果code以AS开头，则全部商品不能自主退款
  for (const code of discountCodes) {
    if (!discountCodes && code.startsWith('AS')) {
      //unreturnProduct数组等于当前数组，加上products数组
      unReturnItem = flineItems.slice();
      flineItems = [];
    }
  }
  //todo: 判断条件2：获取fulfillment的status，如果status不含delivered，则去除
  // for (const events of fulfillmentEvents) {
  //   let check = false;
  //   for (const event of events) {
  //     if (event.status === 'DELIVERED') {
  //       check = true;
  //       break;
  //     }
  //   }
  //   if (!check) {
  //     unreturnProduct = products;
  //     products = [];
  //     break;
  //   }
  // }


  //下面进行tag和type的筛选
  const tagResponse = await context.storefront.query(`#graphql
      query getmetaObjects {
metaobjects(type: "Unreturnable_tag", first: 100) {
  edges {
    node {
      id
      fields {
        key
        value
        reference {
          ... on Metaobject {
            id
            type
          }
        }
      }
    }
  }
}
}
       `);
  const typeResponse = await context.storefront.query(`#graphql
      query getmetaObjects {
metaobjects(type: "Unreturnable_type", first: 100) {
  edges {
    node {
      id
      fields {
        key
        value
        reference {
          ... on Metaobject {
            id
            type
          }
        }
      }
    }
  }
}
}
       `);
  const tags = tagResponse.metaobjects.edges.map((edge: any) => edge.node.fields[0].value);
  const tagSet = new Set(tags);
  const types = typeResponse.metaobjects.edges.map((edge: any) => edge.node.fields[0].value);
  const typeSet = new Set(types);
  const metaobjects = response.metaobjects.edges.map((edge: any) => edge.node);
  //在此处进行tags的筛选
  const productIdSet = new Set(flineItems.map((product: any) => product.productId));
  const productIdList = Array.from(productIdSet);
  const tagsResponse = await context.storefront.query(`#graphql
query getTags {
  nodes(ids: ["${productIdList.join('","')}"]) {
    ... on Product {
      id
      tags
      productType
    }
  }
}
     `);
  //将flineItems中的productType转为map，id为key，productType为value
  const productTypeMap = new Map();
  flineItems.forEach((product: any) => {
    productTypeMap.set(product.productId, product.productType);
  });
  //将tagsResponse中的nodes转为map，id为key，productType为value
  const typesMap = new Map();
  tagsResponse.nodes.forEach((node: any) => {
    typesMap.set(node.id, node.productType);
  });
  //将tagsResponse中的nodes转为map，id为key，tags为value
  const tagsMap = new Map();
  tagsResponse.nodes.forEach((node: any) => {
    tagsMap.set(node.id, node.tags);
  });
  //将flineItems中的productID在tagsmap中获取到对应的tags，tags与tagSet比较，如果有相同的，则将其加入到unReturnItem中,并将其从flineItems中删除
  flineItems.forEach((product: any) => {
    const tags = tagsMap.get(product.productId);
    const productType = typesMap.get(product.productId);
    if (productType) {
      if (typeSet.has(productType)) {
        product.refundableQuantity = product.quantity;
        unReturnItem.push(product);
        return;
      }
    }
    if (tags) {
      for (const tag of tags) {
        if (tagSet.has(tag)) {
          product.refundableQuantity = product.quantity;
          unReturnItem.push(product);
          break;
        }
      }
    }
  });

  //将unreturnItem中的元素，在flineItems中删除
  unReturnItem.forEach((item: any) => {
    const index = flineItems.indexOf(item);
    flineItems.splice(index, 1);
  });
  //unReturnItem的元素，还要加上flineItems中quantity大于refundableQuantity的元素，并设置其refundableQuantity为quantity-refundableQuantity
  flineItems.forEach((item: any) => {
    if (item.quantity == 0) {
      //则将其加入到unReturnItem中，并在flineItems中删除
      unReturnItem.push(item);
      const index = flineItems.indexOf(item);
      flineItems.splice(index, 1);
    }
    else if (item.quantity > item.refundableQuantity) {
      const tmp = Object.create(Object.getPrototypeOf(item), Object.getOwnPropertyDescriptors(item));
      tmp.refundableQuantity = item.quantity - item.refundableQuantity;
      unReturnItem.push(tmp);
    }
  });


  return json({ orderId, flineItems, metaobjects, order, unReturnItem, key });
}

