/**
 * @author: Karthik VJ
 * @import: chrome_local_data.js
 **/


var Settings = function()
{

    var thisObject = this;
    var saveButton;
    var backButton;
    var freq;
    var region;

    var saveMessage;

    this.init = function()
    {
        saveButton = document.getElementById("save");
        saveButton.addEventListener("click", onSaveClickHandler);

        backButton = document.getElementById("back");
        backButton.addEventListener("click", onBackButtonClickHandler);

        freq = document.getElementById("freq");
        region = document.getElementById("region");
        saveMessage = document.getElementById("success_message");

        localData.getLocalData(Key.REGION, function(data)
        {
            console.log("region,  " + data);
            if(data)
            {
                var index = getIndexFromValue(data, region);
                region.selectedIndex = index;
            }
        });

        localData.getLocalData(Key.FREQUENCY, function(data)
        {
            console.log("freq,  " + data);
            if(data)
            {
                var index = getIndexFromValue(data, freq);
                freq.selectedIndex = index;
            }
        });

    };

    /**
     * Invoked when save button is clicked
     * @param event
     */
    var onSaveClickHandler = function(event)
    {
        //alert("click");
        saveMessage.style.display = "none";
        var freqValue = freq[freq.selectedIndex].value;
        var regionValue = region[region.selectedIndex].value;

        localData.storeData(freqValue, regionValue, function()
        {
            //alert("data saved!");
            saveMessage.style.display = "block";
        });
    };

    var onBackButtonClickHandler = function(event)
    {
        location.href = "notification.html";
    };

    var getIndexFromValue = function(value, selectBox)
    {
        for(var i = 0; i < selectBox.length; i++)
        {
            //console.log(selectBox[i].value);
            if(selectBox[i].value == value)
            {
                return i;
            }
        }

        return 0;
    };

    this.onLocalDataChanged = function(key, value)
    {
        console.log("settings, local data change");
    };
};

var settings = new Settings();
var localData = new ChromeLocalData(settings);

window.addEventListener("load", onLoadComplete);

function onLoadComplete()
{
    settings.init();
}