/**
 * @author: Karthik VJ
 **/

var Notify = function()
{

    var thisObject = this;

    var activityContainer;
    var kpInfo;
    var timer;

    var displayNewData = function(isSuccess)
    {
        clearTimeout(timer);
        var mapValue = backgroundPage.localSettings.mapValue;
        if(!mapValue)
        {
            location.href = "settings.html";
            return;
        }

        activityContainer = document.getElementById("activity");
        clearActivityContainer(true);

        kpInfo = document.getElementById("kp_info");
        var data = backgroundPage.service.selectedData;
        var refreshButton = document.getElementById("refresh");

        if(refreshButton)
        {
            refreshButton.removeEventListener("click", onRefreshClick, false);
        }

        var kp = "no data";
        var kp_oneHour = "no data";
        var kp_fourHour = "no data";
        var result = "ERR";
        var timeDifference = -1;

        if(isSuccess && data)
        {
            if(data.kp >= 0)
            {
                kp = data.kp.toString();
            }

            if(data.kp_oneHour >= 0)
            {
                kp_oneHour = data.kp_oneHour.toString();
            }

            if(data.kp_fourHour >= 0)
            {
                kp_fourHour = data.kp_fourHour.toString();
            }

            if(data.result)
            {
                result = data.result;
            }

            var today = new Date();
            timeDifference =  Math.floor((today.getTime() - data.timeStamp.getTime()) / 60000);
        }

        //console.log(data);
        kpInfo.innerHTML = "Now: Kp = " + kp + " (" + result + ") &nbsp;<a href='http://www.spaceweather.com/glossary/kp.html' target='_blank' class='sunshine' title='Relationship between Kp and the Aurora'>explanation</a><div class='gap'></div>";
        kpInfo.innerHTML += "<span class='smallText'>1-hour Prediction: Kp = " + kp_oneHour + "</span><br>";
        kpInfo.innerHTML += "<span class='smallText'>4-hours Prediction: Kp = " + kp_fourHour + "</span><br><br>";

        var dateText = "";

        if(timeDifference == -1)
        {
            dateText = "Error";
        }
        else if(timeDifference === 0)
        {
            dateText = "just now";
        }
        else if(timeDifference === 1)
        {
            dateText = "1 minute ago";
        }
        else
        {
            dateText = timeDifference.toString() + " minutes ago";
        }

        kpInfo.innerHTML += "<span class='smallerText'>Updated: " + dateText + " <a href='#' id='refresh' title='Refresh'>(refresh)</a></a> " +  "</span>";

        refreshButton = document.getElementById("refresh");
        refreshButton.addEventListener("click", onRefreshClick, false);


        var mapBlob = backgroundPage.service.imageCache;
        if(mapBlob)
        {
            timer = window.setTimeout(function()
            {
                //console.log("show map!");

                var img = document.createElement("img");
                img.onload = function(event)
                {
                    clearActivityContainer(false);
                    activityContainer.appendChild(img);

                    URL.revokeObjectURL(event.target.src);
                };
                img.setAttribute("src", URL.createObjectURL(mapBlob));
                img.setAttribute("width", "450px");
                img.setAttribute("height", "450px");

            }, 100);
        }
        else
        {
            showErrorMapText();
        }


    };

    var clearActivityContainer = function(showLoading)
    {
        if(activityContainer)
        {
            while (activityContainer.firstChild)
            {
                activityContainer.removeChild(activityContainer.firstChild);
            }
        }

        if(showLoading)
        {
            showLoadingMapText(0);
        }
    };

    var showLoadingMapText = function(pct)
    {
        if(activityContainer)
        {
            //var pctString = (pct <= 0) ? "" : pct.toString() + "%";
            var pctString = pct.toString() + "%";
            activityContainer.innerHTML = "<br>&nbsp;Loading Auroral Oval Map.. " + pctString;
        }

    };

    var showErrorMapText = function()
    {
        if(activityContainer)
        {
            activityContainer.innerHTML = "<br>&nbsp;Error loading map :'(";
        }

    };

    var onRefreshClick = function()
    {
        clearActivityContainer(true);
        backgroundPage.service.load();
        return false;
    };

    this.init = function()
    {
        displayNewData(true);
        chrome.extension.onMessage.addListener(onMessage);

    };

    /**
     * Invoked when Background js sends new Kp data
     * @param data
     * @param sender
     * @param response
     */
    var onMessage = function(data, sender, response)
    {
        console.log("message from bg script, data " + data.type);
        if(!data || !data.type)
        {
            console.log("unknown data message");
            return;
        }

        backgroundPage = chrome.extension.getBackgroundPage();
        var messageType = backgroundPage.ChromeMessage.messageType;
        var service = backgroundPage.service;

        switch (data.type)
        {
            case messageType.IO_ERROR:
                displayNewData(false);
                break;

            case messageType.IMAGE_PROGRESS:
                showLoadingMapText(service.imageDownLoadPercent);
                break;

            case messageType.IMAGE_COMPLETE:
                displayNewData(true);
                break;
        }
    };


};


var notify = new Notify();
var backgroundPage = chrome.extension.getBackgroundPage();

window.addEventListener("load", onLoadComplete);

function onLoadComplete()
{
    //console.log("load complete!");
    notify.init();
}