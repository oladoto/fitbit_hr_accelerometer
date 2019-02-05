import * as fs from "fs";
import { me } from "appbit";
import { outbox } from "file-transfer";
import * as messaging from "messaging";
import { peerSocket } from "messaging";

import { Accelerometer } from "accelerometer";
import { HeartRateSensor } from "heart-rate";

let fh = 0;
var fupload = 0;
let fileName = "heartrate.json";
let fileNameUpload = "heartrate_upload.json";
var hrm;
var accel;
var numRecords;
var message_interval;
var uploadOngoing = false;
var hrDataReady = false;
var accelDataReady = false;

// setup variables for updating the record
var recCounter = 0;
var fitbitIdentifier = "A";
var sentBuffer = new ArrayBuffer(1);
var sentFlag = new Uint8Array(sentBuffer, 0, 1); // 1 x 1 bytes
sentFlag[0] = 1;

//communication plan
//sensing rate - 5 secs
var sensorRate = 5000; 
//data transfer rate - 10 mins
var dataTransferRate = 10 * 60 * 1000;
//data transfer back-off rate - 10 secs
var backoffRate = 10000;


//setup variables for the record format
let recSize = 34;
var buffer = new ArrayBuffer(recSize);

var accX = new Float64Array(buffer, 0, 1); // 1 x 8 bytes
var accY = new Float64Array(buffer, 8, 1); // 1 x 8 bytes
var accZ = new Float64Array(buffer, 16, 1); // 1 x 8 bytes
var mdate = new Float64Array ( buffer, 24, 1); // 1 x 8 bytes
var heartRate = new Uint16Array(buffer, 32, 1); // 1 x 2 bytes

var myDate = Date.now();
let recCount = 0;
let firstUnsent = 0;

function writeRecord() {

    fh = fs.openSync(fileName, 'a+');

    fs.writeSync(fh, buffer); // write the record
    fs.closeSync(fh); // and commit changes -- important if you are about to read from the file  

}


function getNumberOfRecords() {
    var recCount = 0;
    let stats = fs.statSync(fileName);
    if (stats) {
        recCount = stats.size / recSize;
    }
    return recCount;
}

function uploadToCompanion() 
{
    numRecords = getNumberOfRecords();
    console.log("Number of records : " + numRecords);
    
    if(numRecords>0)
    {
        if(numRecords>20){
            console.log("Uploading data...");
            /*
            fs.copyFile(fileName, fileNameUpload, function(err){
                if (err) throw err;
                console.log('source.txt was copied to ' + fileNameUpload);
              });
              */
            //declare file handler here and pass into function
            fupload = fs.openSync(fileName, 'r');
            //message_interval = setInterval(function(){ sendMessages(fupload, numRecords); }, 5000);
            var recLocation = 0; 
            sendMessages(fupload, numRecords, recLocation);
        }
    }
}

function sendMessages(fupload, remainingRecords, recLocation)
{
    //var sInterval = 0;
    let maxUpload = 20;
    
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        if(recLocation<remainingRecords){
            for (let i = 0; i<maxUpload && recLocation<remainingRecords; i++) {
                fs.readSync(fupload, buffer, 0, recSize, recLocation * recSize);
                send(messaging, fitbitIdentifier, heartRate[0], accX[0], accY[0], accZ[0], mdate[0]);
                ++recLocation;
            }
            setTimeout(sendMessages.bind(this, fupload, remainingRecords, recLocation), 20000);
        }else{
            //clearInterval(sInterval);
            fs.closeSync(fupload);
            //clear duplicate file
            fh = fs.openSync(fileName, 'w');
            fs.closeSync(fh);
          
            console.log("File is empty");
        }
    }
}

function send(messaging, fitbitid, heartrate, accx, accy, accz, datetime)
{
    messaging.peerSocket.send({
      "record" : 1,
      "fitbitId" : fitbitid,
      "heartrate" : heartrate,
      "accx" : accx,
      "accy" : accy,
      "accz" : accz,
      "datetime" : datetime
    });
    
}

if (me.permissions.granted("access_activity")) {
  accel = new Accelerometer({frequency: 1});
  accel.onreading = function(){
        accX[0] = accel.x;
        accY[0] = accel.y;
        accZ[0] = accel.z;
        mdate[0] = Date.now();
        accel.stop();
        //accelDataReady = true;
        writeRecord();
        
      };
    accel.start();
}
//var filePath = "/private/data/heartrate.json";

if (me.permissions.granted("access_heart_rate")) {
    hrm = new HeartRateSensor();

  hrm.onreading = function () {
    //demotext.text = "HR : " + hrm.heartRate;
    heartRate[0] = hrm.heartRate;

  };
  hrm.start();
}

setInterval(
  function()
  { 
    accel.start();
  }, 
  //sensorRate
  5000
);

setInterval(
  function()
  { 
    uploadToCompanion();
  }, 
  //dataTransferRate
  1200000
  //10000   //30 mins
);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}