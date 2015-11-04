/**
 * @author: Karthik VJ
 */


var console = console || {};

var Enum = {

    TITLE: "Katu Aurora",

    QUIET: "Quiet",
    ACTIVE: "Active",
    STORM: "Storm",

    MAP: {
        "eu":"http://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.png",
        "usa":"http://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.png",
        "nz":"http://services.swpc.noaa.gov/images/aurora-forecast-southern-hemisphere.png",
        "ata":"http://services.swpc.noaa.gov/images/aurora-forecast-southern-hemisphere.png"
    }
};

var localSettings = {
    updateFrequency: 900000, // in milliseconds (default 15 mins)
    mapValue: null
};

var NOAAService = (function()
{
    var thisObject;
    var timer;
    var request;

    var CONSTS = {
        DATA_URL: "http://services.swpc.noaa.gov/text/wing-kp.txt",
        DATA_START_INDEX: 16,
        DATA_ROW_LENGTH: 15,
        KP_INDEX: 14,
        KP_1HR_INDEX: 8,
        KP_4HR_INDEX: 13
    };

    function NOAAService()
    {
        // constructor
        thisObject = this;
        this.selectedData = null;
        this.imageCache = null;
        this.imageDownLoadPercent = 0;
    }

    /**
     * Load service
     * @public
     */
    NOAAService.prototype.load = function()
    {
        if(timer)
        {
            clearTimeout(timer);
        }
        console.log("load..");

        if(!navigator.onLine)
        {
            console.log("offline - no internet connection");
            onError();
            return;
        }

        request = new XMLHttpRequest();
        request.open("GET", CONSTS.DATA_URL, true);
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
            console.log("onStateChange, error loading data from NOAA");
            onError();
        }
    };

    var onError = function()
    {
        console.log("onError >> load error");
        if(!navigator.onLine)
        {
            isOfflineError = true;
        }

        ChromeMessage.sendError();
        Badge.showError();
        startLoadTimer();
    };

    var onLoad = function()
    {
        if(this.status != 200)
        {
            return;
        }

        isOfflineError = false;
        var data = this.responseText;
        thisObject.imageCache = null;
        // parse the text data
        //thisObject.dataList = [];
        data = data.split("\n");
        data.splice(0, CONSTS.DATA_START_INDEX);

        var dataLen = data.length;
        for(var i = dataLen - 1; i >= 0; i--)
        {
            var rowData = data[i];
            // remove duplicate whitespace
            rowData = rowData.replace(/\s+/g, ' '); // .trim() doesn't seem to work :(
            var item = rowData.split(' ');

            if(item.length != CONSTS.DATA_ROW_LENGTH)
            {
                continue;
            }

            var auroraData = new AuroraData();
            auroraData.timeStamp = new Date(Date.now());
            auroraData.kp = item[CONSTS.KP_INDEX];
            auroraData.kp_oneHour = item[CONSTS.KP_1HR_INDEX];
            auroraData.kp_fourHour = item[CONSTS.KP_4HR_INDEX];

            if(auroraData.kp < 0)
            {
                continue;
            }

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

            thisObject.selectedData = auroraData;
            break;
        }

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

        thisObject.imageDownLoadPercent = 0;
        request = new XMLHttpRequest();
        request.open("GET", localSettings.mapValue, true);
        request.responseType = "blob";
        request.send(null);
        request.onload = onImageLoadComplete;
        request.onerror = onError;
        request.onprogress = onImageProgress;
        request.onreadystatechange = onStateChange;
    };

    var onImageProgress = function(event)
    {
        if(event.lengthComputable)
        {
            thisObject.imageDownLoadPercent = ((event.loaded / event.total) * 100) | 0;
            //console.log("percentComplete " + thisObject.imageDownLoadPercent);
            ChromeMessage.sendImageProgress();
        }
    };

    var onImageLoadComplete = function()
    {
        if(this.status == 404)
        {
            return;
        }

        thisObject.imageDownLoadPercent = 100;
        thisObject.imageCache = this.response;
        console.log("image blob loaded " + thisObject.imageCache);

        loadNext();
    };

    var loadNext = function()
    {
        // notify popup
        //........
        ChromeMessage.sendImageLoadComplete();

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

    /**
     * onLocalDataChanged
     * @param key
     * @param value
     * @public
     */
    NOAAService.prototype.onLocalDataChanged = function(key, value)
    {
        console.log("bg, local data changed, " + key + ", " + value);
        if(key == Key.FREQUENCY)
        {
            localSettings.updateFrequency = value;
        }

        if(key == Key.REGION)
        {
            // update popup
            localSettings.mapValue = Enum.MAP[value];
        }
    };

    /**
     * onLocalDataChangeFinish
     * @public
     */
    NOAAService.prototype.onLocalDataChangeFinish = function()
    {
        console.log("onLocalDataChangeFinish");
        thisObject.load();
    };

    return NOAAService;
})();


var AuroraData = (function()
{
    function AuroraData()
    {
        // constructor
        this.kp;
        this.kp_oneHour;
        this.kp_fourHour;
        this.timeStamp;
        this.result;
    }

    return AuroraData;
})();

/**
 * Display badge text
 */
var Badge = {
    _COLOR_QUIET: "#009966",
    _COLOR_ACTIVE: "#ffa800",
    _COLOR_STORM: "#FF0000",

    show: function(data)
    {
        if(!data || !data.kp)
        {
            console.log("cannot show value in badge, data is null!");
            this.showError();
            return;
        }
        var kpValue = Math.round(data.kp);
        var selectedColor = Badge._COLOR_QUIET;
        var space = " ";

        if(kpValue > 9)
        {
            space = "";
        }

        if(data.result == Enum.QUIET)
        {
            selectedColor = Badge._COLOR_QUIET;
        }
        else if(data.result == Enum.ACTIVE)
        {
            selectedColor = Badge._COLOR_ACTIVE;
        }
        else if(data.result == Enum.STORM)
        {
            selectedColor = Badge._COLOR_STORM;
        }

        var title = Enum.TITLE + " - " + data.result;
        var text = "Kp" + space + kpValue;

        chrome.browserAction.setTitle({title : title});
        chrome.browserAction.setBadgeBackgroundColor({color: selectedColor});
        chrome.browserAction.setBadgeText({text : text});
    },


    showError: function()
    {
        var title = Enum.TITLE + " - Error";
        chrome.browserAction.setTitle({title : title});
        chrome.browserAction.setBadgeBackgroundColor({color: "#ff0000"});
        chrome.browserAction.setBadgeText({text : "ERR"});
    }
};

/**
 * Utils
 */
var Utils = {

    parseTimeStamp : function(data)
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
    }
};


/**
 * Chrome's runtime.sendMessage helper
 */
var ChromeMessage = {
    messageType : {
        IO_ERROR: "ioError",
        IMAGE_PROGRESS: "imageProgress",
        IMAGE_COMPLETE: "imageComplete"
    },

    sendError: function()
    {
        console.log(">> sendError");
        chrome.runtime.sendMessage({type: ChromeMessage.messageType.IO_ERROR});
    },

    sendImageProgress: function()
    {
        console.log(">> sendImageProgress");
        chrome.runtime.sendMessage({type: ChromeMessage.messageType.IMAGE_PROGRESS});
    },

    sendImageLoadComplete: function()
    {
        console.log(">> sendImageLoadComplete");
        chrome.runtime.sendMessage({type: ChromeMessage.messageType.IMAGE_COMPLETE});
    }
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
    if(isOfflineError == true)
    {
        isOfflineError = false;

        window.setTimeout(function(){
            service.load();
        }, 2000);

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
