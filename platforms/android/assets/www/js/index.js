/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },

    takePicture: function() {
        console.log("in the takePicture")
        navigator.camera.getPicture(onSuccess, onFail, {
            quality: 50,
            destinationType: Camera.DestinationType.FILE_URI
        });

        function onSuccess(imageURI) {
            var image = document.getElementById('myImage');
            image.src = imageURI;
        }

        function onFail(message) {
            alert('Failed because: ' + message);
        }
    },
    speech: function() {
        var speechKit = new NuanceSpeechKitPlugin();


        function setRecoDialogVisibile(visibility) {
            recoDialog = document.getElementById("reco-dialog");
            if (visibility == true) {
                recoDialog.style.visibility = "visible";
            } else {
                recoDialog.style.visibility = "hidden";
            }
        }

        function toggleRecoDialog() {
            recoDialog = document.getElementById("reco-dialog");
            recoDialog.style.visibility = (recoDialog.style.visibility == "visible") ? "hidden" : "visible";
        }

        function setTTSDialogVisibile(visibility) {
            ttsDialog = document.getElementById("tts-dialog");
            if (visibility == true) {
                ttsDialog.style.visibility = "visible";
            } else {
                ttsDialog.style.visibility = "hidden";
            }
        }

        function toggleTTSDialog() {
            ttsDialog = document.getElementById("tts-dialog");
            ttsDialog.style.visibility = (ttsDialog.style.visibility == "visible") ? "hidden" : "visible";
        }


        function doInit() {
            //console.log("Before init");

            var serverURL = "sandbox.nmdp.nuancemobility.net";
            speechKit.initialize("Credentials", serverURL, 443, false, function(r) {
                printResult(r)
            }, function(e) {
                printResult(e)
            });

            //console.log("After init");

        }

        function doCleanup() {
            speechKit.cleanup(function(r) {
                printResult(r)
            }, function(e) {
                printResult(e)
            });
        }

        function startRecognition() {
            console.log("reco")

            printRecoStage("Listening");
            var recoTypeSelect = document.getElementById("reco-type");
            var recoType = recoTypeSelect.value;
            var recoLanguageSelect = document.getElementById("reco-language");
            var recoLanguage = recoLanguageSelect.value;
            var stopButton = document.getElementById("stop-reco");
            stopButton.disabled = false;

            console.log("Before startRecognition");
            speechKit.startRecognition(recoType, recoLanguage, function(r) {
                printRecoResult(r)
            }, function(e) {
                printRecoResult(e)
            });
            console.log("After startRecognition");
            setRecoDialogVisibile(false);
            var tempObj = new Object();
        }


        function stopRecognition() {
            var stopButton = document.getElementById("stop-reco");
            stopButton.disabled = true;
            speechKit.stopRecognition(function(r) {
                printRecoResult(r)
            }, function(e) {
                console.log(e)
            });

        }


        function getResult() {
            speechKit.getResults(function(r) {
                printResult(r)
            }, function(e) {
                console.log(e)
            });
        }

        function playTTS() {
            var ttsTextField = document.getElementById("tts-text");
            var text = ttsTextField.value;
            if (text.length > 0) {
                printRecoStage("Playing TTS");

                var ttsLanguageSelect = document.getElementById("tts-language");
                var ttsLanguage = ttsLanguageSelect.value;

                var playButton = document.getElementById("play-tts");
                playButton.disabled = true;
                var stopButton = document.getElementById("stop-tts");
                stopButton.disabled = false;

                setTTSDialogVisibile(true);
                speechKit.playTTS(text, ttsLanguage, null, function(r) {
                    printTTSResult(r)
                }, function(e) {
                    printTTSResult(e)
                });
            }
        }

        function stopTTS() {
            printRecoStage("Stopping TTS");
            //var playButton = document.getElementById("play-tts");
            //playButton.disabled = false;
            //var stopButton = document.getElementById("stop-tts");
            //stopButton.disabled = true;
            speechKit.stopTTS(function(r) {
                printTTSResult(r)
            }, function(e) {
                printTTSResult(e)
            });
        }

        function printTTSResult(resultObject) {

            var innerHtmlText = getHtml(resultObject);
            document.getElementById("result").innerHTML = innerHtmlText;
            if (resultObject.event != undefined) {
                if (resultObject.event == 'TTSStarted' || resultObject.event == 'TTSPlaying') {
                    //speechKit.queryNextEvent( function(r){printTTSResult(r)}, function(e){printTTSResult(e)} );
                }
                if (resultObject.event == 'TTSStopped' || resultObject.event == 'TTSComplete' || resultObject.event == 'TTSError') {
                    var playButton = document.getElementById("play-tts");
                    playButton.disabled = false;
                    var playButton = document.getElementById("stop-tts");
                    playButton.disabled = true;
                    setTTSDialogVisibile(false);
                }
            }
        }


        function printRecoResult(resultObject) {
            if (resultObject.event == 'RecoVolumeUpdate') {
                setVolumeLevel(resultObject);
            } else {
                if (resultObject.event == 'RecoComplete' || resultObject.event == 'RecoStopped' || resultObject.event == 'RecoError') {
                    var stopButton = document.getElementById("stop-reco");
                    stopButton.disabled = true;
                    setRecoDialogVisibile(false);
                }
                var innerHtmlText = getHtml(resultObject);

                document.getElementById('status_stage').value = resultObject.result
            }
        }


        function printResult(resultObject) {
            var innerHtmlText = getHtml(resultObject);
            document.getElementById("result").innerHTML = innerHtmlText;
        }

        function printRecoStage(stage) {
            var resultObject = new Object();
            resultObject.event = stage;
            var innerHtmlText = getHtml(resultObject);
            document.getElementById("result").innerHTML = innerHtmlText;
        }

        function setVolumeLevel(resultObject) {
            var htmlText = " Volume: " + resultObject.volumeLevel;
            document.getElementById("volume-level").innerHTML = htmlText;
        }

        function getHtml(resultObject) {
            var htmlText = "<ul><li>Return Code: " + resultObject.returnCode;
            htmlText = htmlText + "</li></ul>";
            htmlText = htmlText + "<ul><li>Return Text: " + resultObject.returnText;
            htmlText = htmlText + "</li></ul>";
            if (resultObject.result != undefined) {
                htmlText = htmlText + "<ul><li>Result: " + resultObject.returnText;
                htmlText = htmlText + "</li></ul>";
            }
            if (resultObject.results != undefined) {
                var resultCount = resultObject.results.length;
                var i = 0;
                htmlText = htmlText + "<ul><li>Results Details:";
                for (i = 0; i < resultCount; i++) {
                    htmlText = htmlText + "<br>" + i + ": " + resultObject.results[i].value + " [" + resultObject.results[i].confidence + "]";
                }
                htmlText = htmlText + "</li></ul>";
            }
            if (resultObject.event != undefined) {
                htmlText = htmlText + "<ul><li>Event: " + resultObject.event;
                htmlText = htmlText + "</li></ul>";
            }
            return htmlText;
        }


        function setActiveTab(num) {

            var tabList = document.getElementById("tab-list");
            var tab = tabList.firstChild;

            var i = 0;
            do {
                if (tab.tagName == "A") {
                    i++;
                    tab.href = "javascript:setActiveTab(" + i + ");";
                    if (i == num) {
                        tab.className = "Active";
                    } else {
                        tab.className = "";
                    }
                    tab.blur();
                }
            }
            while (tab = tab.nextSibling);

            var tabContent = document.getElementById("tab-content");
            var tabData = tabContent.firstChild;

            var i = 0;
            do {
                if (tabData.className == "tab-data") {
                    i++;
                    if (tabContent.offsetHeight) {
                        tabData.style.height = (tabContent.offsetHeight - 2) + "px";
                    }
                    tabData.style.overflow = "auto";
                    if (i == num) {
                        tabData.style.display = "block";
                    } else {
                        tabData.style.display = "none";
                    }
                }
            }
            while (tabData = tabData.nextSibling);
        }

    }
};