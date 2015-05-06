/**
 * @author: Karthik VJ
 * // test
 */


var console = console || {};

var Properties = new function()
{
    this.title = "Katu Aurora";
};

var Enum = new function()
{
    this.QUIET = "Quiet";
    this.ACTIVE = "Active";
    this.STORM = "Storm";

    this.MAP = { "eu":"http://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.png",
        "usa":"http://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.png",
        "nz":"http://services.swpc.noaa.gov/images/aurora-forecast-southern-hemisphere.png",
        "ata":"http://services.swpc.noaa.gov/images/aurora-forecast-southern-hemisphere.png"
    };
};

var localSettings = new function()
{

    this.updateFrequency = 900000; // in milliseconds (default 15 mins)
    this.mapValue;
};

var NOAAService = function()
{
    var dataURL = "http://services.swpc.noaa.gov/text/wing-kp.txt";
    var separator = "        ";
    var sep_2 = "   ";

    //this.dataList = [];
    this.selectedData;
    this.imageCache;


    var thisObject = this;
    var timer;
    var request;


    this.load = function()
    {
        if(timer)
        {
            clearTimeout(timer);
        }
        console.log("load..");
        if(!navigator.onLine)
        {
            console.log("offline - no internet connection");
            isOfflineError = true;
            Badge.showText("ERR", true);
            startLoadTimer();
            return;
        }

        request = new XMLHttpRequest();
        request.open("GET", dataURL, true);
        request.responseType = "text";
        request.send(null);
        request.onload = onLoad;
        request.onerror = onError;
        request.onreadystatechange = onStateChange;
        //$.get(dataURL, onData);
    };

    var onStateChange = function()
    {
        if(this.readyState == 4 && this.status == 404)
        {
            console.log("error loading data from NOAA");
            startLoadTimer();
        }


    };

    var onError = function()
    {
        console.log("onError >> load error");
        startLoadTimer();

    };

    var onLoad = function()
    {
        //console.log(this.status);
        if(this.status == 404)
        {
            //loadNext();
            console.log("onLoad error");
            startLoadTimer();
            return;
        }

        isOfflineError = false;
        var data = this.responseText;
        thisObject.imageCache = null;
        // parse the text data
        //thisObject.dataList = [];
        data = data.split("\n");
        data.splice(0, 20);

        for(var i = data.length - 1; i >= 0; i--)
        {
            //console.log(data[i]);
            var item = data[i].split(separator);
            if(item.length < 2)
            {
                continue;
            }
            var auroraData = new AuroraData();
            auroraData.kp = item[1];
            var subData = item[0].split(sep_2);
            //console.log(subData);
            for(var j = 0; j < subData.length; j++)
            {
                // time stamp from NOAA
                //auroraData.timeStamp = Utils.parseTimeStamp(subData[0]);
                auroraData.timeStamp = new Date(Date.now());
                auroraData.status = subData[1];
                auroraData.kp_oneHour = subData[3].substr(2);
                auroraData.kp_fourHour = subData[8];

                if(Math.round(auroraData.kp) <= 3)
                {
                    auroraData.result = Enum.QUIET;
                }
                else if(Math.round(auroraData.kp) == 4)
                {
                    auroraData.result = Enum.ACTIVE;
                }
                else
                {
                    auroraData.result = Enum.STORM;
                }
            }
            // check for data status
            // Status(S): 0 = nominal solar wind input data,
            //            1 = data are good but required an extrapolation
            //            2 = data are bad: incomplete ACE speed data
            //            3 = data are bad: solar wind speed input errors; model output likely unreliable
            //            4 = missing Wing Kp data
            if(auroraData.status == 0 || auroraData.status == 1)
            {
                //thisObject.dataList.push(auroraData);
                thisObject.selectedData = auroraData;
                break;
            }


        }

        //console.log(thisObject.dataList);
        //console.log("total records, " + thisObject.dataList.length);

        // send the latest data to pop up.
        //console.log(thisObject.dataList[thisObject.dataList.length - 1]);
        //thisObject.selectedData = thisObject.dataList[thisObject.dataList.length - 1];
        console.log(thisObject.selectedData);
        Badge.show(thisObject.selectedData);

        // load image
        loadImage();

        //loadNext();

    };

    var loadImage = function()
    {
        console.log("load image");
        if(!localSettings.mapValue)
        {
            loadNext();
            return;
        }
        request = new XMLHttpRequest();
        request.open("GET", localSettings.mapValue, true);
        request.responseType = "blob";
        request.send(null);
        request.onload = onImageLoadComplete;
        request.onerror = onError;
        request.onreadystatechange = onStateChange;
    };

    var onImageLoadComplete = function()
    {
        if(this.status == 404)
        {
            return;
        }

        thisObject.imageCache = this.response;
        console.log("image blob loaded " + thisObject.imageCache);

        loadNext();
    };

    var loadNext = function()
    {
        // notify popup
        //........
        chrome.extension.sendMessage({});


        // load again..
        startLoadTimer();
    };

    var startLoadTimer = function()
    {
        console.log('localSettings.updateFrequency ' + localSettings.updateFrequency);
        request = null;
        if(timer)
        {
            clearTimeout(timer);
        }
        timer = setTimeout(service.load, localSettings.updateFrequency);
    };



    this.onLocalDataChanged = function(key, value)
    {
        console.log("bg, local data changed, " + key + ", " + value);
        if(key == Key.FREQUENCY)
        {
            localSettings.updateFrequency = value;
            //thisObject.load();
        }

        if(key == Key.REGION)
        {
            // update popup
            localSettings.mapValue = Enum.MAP[value];
            //chrome.extension.sendMessage(new Object());
        }
    };

    this.onLocalDataChangeFinish = function()
    {
        console.log("onLocalDataChangeFinish");
        thisObject.load();
    };

};

var AuroraData = function()
{
    this.kp;
    this.kp_oneHour;
    this.kp_fourHour;
    this.timeStamp;
    this.status;
    this.result;
};

var Badge = new function()
{
    var COLOR_QUIET = "#009966";
    var COLOR_ACTIVE = "#ffa800";
    var COLOR_STORM = "#FF0000";

    this.show = function(data)
    {
        var kpValue = Math.round(data.kp);
        var title = data.result;
        var selectedColor = COLOR_QUIET;
        var space = " ";

        if(kpValue > 9)
        {
            space = "";
        }

        if(kpValue <= 3)
        {
            selectedColor = COLOR_QUIET;
        }
        else if(kpValue == 4)
        {
            selectedColor = COLOR_ACTIVE;
        }
        else
        {
            selectedColor = COLOR_STORM;
        }

        title = Properties.title + " - " + title;
        chrome.browserAction.setTitle({title : title});
        chrome.browserAction.setBadgeBackgroundColor({color: selectedColor});

        text = "Kp" + space + kpValue;
        chrome.browserAction.setBadgeText({text : text});
    };

    this.showText = function(text, isError)
    {
        if(text.length > 3)
        {
            return;
        }
        var selectedColor = "#009966";
        if(isError)
        {
            selectedColor = "#ff0000";
        }
        chrome.browserAction.setBadgeBackgroundColor({color: selectedColor});
        chrome.browserAction.setBadgeText({text : text});
    }
};

var Utils = new function()
{
    this.parseTimeStamp = function(data)
    {
        var data = data.split("  ");
        var year;
        var month;
        var day;
        var hours;
        var minutes;
        if(data.length < 2)
        {
            console.warn("time stamp error");
            return 0;
        }

        var dateData = data[0];
        dateData = dateData.split(" ");
        year = dateData[0];
        month = dateData[1] - 1;
        day = dateData[2];

        //console.log(data[1]);
        hours = data[1].substring(0, 2);
        minutes = data[1].substring(2, 4);

        //console.log("hours: " + hours + ", minu " + minutes);


        var d = Date.UTC(year, month, day, hours, minutes);
        return new Date(d);
    };
};

var isOfflineError = false;
var service = new NOAAService();
var localData = new ChromeLocalData(service);



window.addEventListener("load", onLoadComplete);

window.addEventListener("online", onNavigatorOnline);
window.addEventListener("offline", onNavigatorOffline);

function onNavigatorOnline()
{
    console.log("bloody hell - online");
    if(isOfflineError === true)
    {
        isOfflineError = false;
        service.load();
    }
}

function onNavigatorOffline()
{
    console.log("navigator went offline!!");
}

function onLoadComplete()
{
    localData.getLocalData(Key.DEBUG, function(data)
    {
        if(data === undefined || data === false)
        {
            console.log = function() {};
        }

        init();
    });

}

function init()
{
    localData.getLocalData(Key.REGION, function(data)
    {
        console.log("region,  " + data);
        if(data)
        {
            localSettings.mapValue = Enum.MAP[data];
        }

        localData.getLocalData(Key.FREQUENCY, function(data)
        {
            console.log("freq,  " + data);
            if(data)
            {
                localSettings.updateFrequency = data;
            }

            service.load();

        });

    });
}
