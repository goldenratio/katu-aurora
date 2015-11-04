/**
 * @author: Karthik VJ
 * @import: chrome_local_data.js
 **/


var Settings = (function()
{

    var thisObject;
    var saveButton;
    var backButton;
    var debugCheckbox;
    var freq;
    var region;

    var saveMessage;

    function Settings()
    {
        // constructor
        thisObject = this;
    }

    /**
     * Init
     * @public
     */
    Settings.prototype.init = function()
    {
        debugCheckbox = document.getElementById("debug_id");

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
                region.selectedIndex = getIndexFromValue(data, region);
            }
        });

        localData.getLocalData(Key.FREQUENCY, function(data)
        {
            console.log("freq,  " + data);
            if(data)
            {
                freq.selectedIndex = getIndexFromValue(data, freq);
            }
        });

        localData.getLocalData(Key.DEBUG, function(data)
        {
            console.log("debug,  " + data);
            if(data === true)
            {
                debugCheckbox.checked = true;
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
        var debug = debugCheckbox.checked;

        localData.storeData(freqValue, regionValue, debug, function()
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

    /**
     * onLocalDataChanged
     * @param key
     * @param value
     * @public
     */
    Settings.prototype.onLocalDataChanged = function(key, value)
    {
        console.log("settings, local data change");
    };

    /**
     * onLocalDataChangeFinish
     * @param key
     * @param value
     * @public
     */
    Settings.prototype.onLocalDataChangeFinish = function(key, value)
    {
        console.log("settings, onLocalDataChangeFinish");
    };

    return Settings;
})();

var settings = new Settings();
var localData = new ChromeLocalData(settings);

window.addEventListener("load", onLoadComplete);

function onLoadComplete()
{
    settings.init();
}