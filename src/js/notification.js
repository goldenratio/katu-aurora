/**
 * @author: Karthik VJ
 **/

var Notify = function()
{

    var thisObject = this;

    var activityContainer;
    var kpInfo;
    var timer;

    var displayNewData = function()
    {
        clearTimeout(timer);
        var mapValue = backgroundPage.localSettings.mapValue;
        if(!mapValue)
        {
            location.href = "settings.html";
            return;
        }

        activityContainer = document.getElementById("activity");
        //activityContainer.innerHTML = "";
        clearActivityContainer(true);

        kpInfo = document.getElementById("kp_info");
        var data = backgroundPage.service.selectedData;
        var refreshButton;
        refreshButton = document.getElementById("refresh");
        if(refreshButton)
        {
            refreshButton.removeEventListener("click", onRefreshClick, false);
        }

        if(data)
        {
            //console.log(data);
            kpInfo.innerHTML = "Now: Kp = " + data.kp + " (" + data.result + ") &nbsp;<a href='http://www.spaceweather.com/glossary/kp.html' target='_blank' class='sunshine' title='Relationship between Kp and the Aurora'>explanation</a><div class='gap'></div>";
            kpInfo.innerHTML += "<span class='smallText'>1-hour Prediction: Kp = " + data.kp_oneHour + "</span><br>";
            kpInfo.innerHTML += "<span class='smallText'>4-hours Prediction: Kp = " + data.kp_fourHour + "</span><br><br>";

            var dateText = "";
            var today = new Date();
            var difference =  Math.floor((today.getTime() - data.timeStamp.getTime()) / 60000);

            if(difference === 0)
            {
                dateText = "just now";
            }
            else if(difference === 1)
            {
                dateText = "1 minute ago";
            }
            else
            {
                dateText = difference.toString() + " minutes ago";
            }

            kpInfo.innerHTML += "<span class='smallerText'>Updated: " + dateText + " <a href='#' id='refresh' title='Refresh'>(refresh)</a></a> " +  "</span>";

            refreshButton = document.getElementById("refresh");
            refreshButton.addEventListener("click", onRefreshClick, false);
        }

        var mapBlob = backgroundPage.service.imageCache;
        if(mapBlob)
        {
            timer = window.setTimeout(function()
            {
                //console.log("show map!");

                var img = document.createElement("img");
                img.onload = function(event)
                {
                    //activityContainer.innerHTML = "";
                    clearActivityContainer(false);

                    //activityContainer.style.backgroundImage = "url("+mapValue+")";
                    activityContainer.appendChild(img);
                    //console.log("event.target.src " + event.target.src);
                    URL.revokeObjectURL(event.target.src);
                };
                img.setAttribute("src", URL.createObjectURL(mapBlob));
                img.setAttribute("width", "450px");
                img.setAttribute("height", "450px");

            }, 100);
        }


    };

    var clearActivityContainer = function(showLoading)
    {
        while (activityContainer.firstChild)
        {
            activityContainer.removeChild(activityContainer.firstChild);
        }

        if(showLoading)
        {
            activityContainer.innerHTML = "<br>&nbsp;Loading Auroral Oval Map..";
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
        displayNewData();
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
        //console.log("message from bg script");
        backgroundPage = chrome.extension.getBackgroundPage();
        displayNewData();
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