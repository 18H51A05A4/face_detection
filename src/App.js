import logo from './logo.svg';
import './App.css';
import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs'
const weights = '/model/model.json';

function App() {

  var value = window.location.href.split("?")[1]
  var user_id = value.split('&')[1].split('=')[1]
  var is_registration = value.split('&')[0].split('=')[1]
  console.log(is_registration,user_id)
  
  var model=null
  // const [face_image_url,set_face_image_url] = useState('')
  let base64_face_url = null;

  const videoRef=useRef(null);
  const photoRef=useRef(null);
  const faceRef=useRef(null);

  const names=['Face']

  const getvideo=()=>{
    navigator.mediaDevices.getUserMedia({video:{
      width:600,height:400
    }}).then(stream=>{
        let video=videoRef.current;
        video.srcObject=stream;
        video.play();
    }).catch((err)=>{
      console.log(err)
    })
  }


  useEffect(()=>{
    getvideo()

    tf.loadGraphModel(weights).then(res=>{
      console.log('model loaded')
      model=res
    })
  },[videoRef])

  const takePhoto=()=>{

  


    const width=600
    const height=400

    let video=videoRef.current;
    let photo=photoRef.current;
    let face=faceRef.current;



    photo.width=width
    photo.height=height


    let ctx=photo.getContext('2d')

    ctx.drawImage(video,0,0,width,height)
    
    const input = tf.tidy(() => {
      return tf.image.resizeBilinear(tf.browser.fromPixels(photoRef.current), [1280, 1280])
        .div(255.0).expandDims(0); 
      });
    
    console.log(input)

    model.executeAsync(input).then(res => {
      // Font options.
      const font = "16px sans-serif";
      ctx.font = font;
      ctx.textBaseline = "top";
      

      const [boxes, scores, classes, valid_detections] = res;
      const boxes_data = boxes.dataSync();
      const scores_data = scores.dataSync();
      const classes_data = classes.dataSync();
      const valid_detections_data = valid_detections.dataSync()[0];

      tf.dispose(res)
      

      const c=photoRef.current

      var i;
      for (i = 0; i < valid_detections_data; ++i){

        const score = scores_data[i].toFixed(2);

        if(score<0.7)
          continue

        let [x1, y1, x2, y2] = boxes_data.slice(i * 4, (i + 1) * 4);
        x1 *= c.width;
        x2 *= c.width;
        y1 *= c.height;
        y2 *= c.height;
        const width = x2 - x1;
        const height = y2 - y1;
        const klass = names[classes_data[i]];

        // Draw the bounding box.
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 4;
        ctx.strokeRect(x1, y1, width, height);

        console.log(x1,y1,x2,y2)

        let ctx1=face.getContext('2d')
        
        ctx1.drawImage(photoRef.current, x1, y1, width, height,
          0, 0, width, height);
        
          let face_image_url=''

          let handlePhotoDownload = () => {
            console.log("Photo1 downloaded");
            const photoCanvas = document.getElementById("faceCanvas");
            console.log(photoCanvas);
            if (photoCanvas) {
              console.log("Photo2 downloaded");
              face_image_url=photoCanvas.toDataURL("image/png");
             // const link = document.createElement("a");
              console.log(face_image_url);
              base64_face_url = face_image_url
              // link.download = "face.png";
              // link.href = url;
              // link.click();
              // console.log("Photo3 downloaded");
            }
          }
          handlePhotoDownload()
         
        // Draw the label background.
        ctx.fillStyle = "#00FFFF";
        const textWidth = ctx.measureText(klass + ":" + score).width;
        const textHeight = parseInt(font, 10); // base 10
        ctx.fillRect(x1, y1, textWidth + 4, textHeight + 4);

      }

      for (i = 0; i < valid_detections_data; ++i){
      
        const score = scores_data[i].toFixed(2);

        
        if(score<0.7)
          continue
      
        let [x1, y1, , ] = boxes_data.slice(i * 4, (i + 1) * 4);
        x1 *= c.width;
        y1 *= c.height;
        const klass = names[classes_data[i]];
        
        // Draw the text last to ensure it's on top.
        ctx.fillStyle = "#000000";
        ctx.fillText(klass + ":" + score, x1, y1);


      }



    })
    
  }
  
  // const save_face_embeddings=()=>{
  //   const data= new FormData()
  //   data.append('image',base64_face_url)
  //   fetch('http://localhost:5000/get_embeddings',{
  //     method:"post",
  //     body:data
  //   })
  //   .then(res=>res.json())
  //   .then(data=>console.log(data))

  // }

  const save_face_embeddings=()=>{

    var request_body = {
      username : user_id,
      image : base64_face_url
    }
    fetch("http://127.0.0.1:8000/save-user-encodings-using-model",
    {
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(request_body)
    })
    .then(res=>res.json() )
    .then(data=>console.log(data))
    .catch(res=>res.json() )
    .then(data=>console.log(data))
    

  }

  // const verify_face_embeddings=()=>{
  //   const data= new FormData()
  //   data.append('image',base64_face_url)
  //   fetch('http://localhost:5000/verify',{
  //     method:"post",
  //     body:data
  //   })
  //   .then(res=>res.json() )
  //   .then(data=>console.log(data))
  // }

  const verify_face_embeddings=()=>{
    
    var request_body = {
      username : user_id,
      image : base64_face_url
    }
    fetch("http://127.0.0.1:8000/verify-user-encodings-using-model",
    {
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(request_body)
    })
    .then(res=>res.json() )
    .then(data=>console.log(data))
    .catch(res=>res.json() )
    .then(data=>console.log(data))

  }

  return (
    
  <div className='App'>
    <div className='extracted_face' style={{display:"None"}}>
      <canvas id='faceCanvas' ref={faceRef}></canvas>
    </div>
    
    <div className='camera'>
      <video ref={videoRef}></video>
      <button onClick={takePhoto}>snap</button>
      {is_registration === 'true' ?
      <button onClick={save_face_embeddings}>save face mapping</button>
      :
      <button onClick={verify_face_embeddings}>verify face mapping</button>}
    </div>

    <div className='result'>
      <canvas ref={photoRef}></canvas>
    </div>
    
  </div>

    );
}

export default App;
