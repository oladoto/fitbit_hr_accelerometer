/*
 * Entry point for the companion app
 */
import { inbox } from "file-transfer";
import * as messaging from "messaging";
/*
inbox.onnewfile = (event) => {
   console.log('Received ${event.file.length} bytes as ${event.file.name}');
}
*/
//messaging.peerSocket.onopen = function() {
  //if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.onmessage = function(evt) {
      
      var url = [remote REST API here];
      
      console.log("Companion: " + evt.data.datetime);
      
      fetch(url2, {
            method: "POST",
            headers : { 
              "Content-Type": "application/json",
              "Accept": "application/json"
             },
            body: JSON.stringify(evt.data)
            })
      .then(function(response){
          return response.json();
      })
      .then(function(text){
      }).catch((error) => {
        //console.log(error)
      });
      
    }
  //}
  
  messaging.peerSocket.onerror = function(err) {
    console.log("Connection error: " + err.code + " - " + err.message);
  }
  //}

/*
// Process the inbox queue for files, and read their contents as text
async function processAllFiles() {
  let file;
  while ((file = await inbox.pop())) {
    const payload = await file.text();
    console.log('file contents: ${payload}');
  }
}

// Process new files as they are received
inbox.addEventListener("newfile", processAllFiles);

// Also process any files that arrived when the companion wasn’t running
processAllFiles();
*/
