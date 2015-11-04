/**
 * @author: Karthik VJ
 **/

var Key = {

    FREQUENCY: "frequency",
    REGION: "region",
    DEBUG: "debug"
};

var ChromeLocalData = (function()
{
    var thisObject;

    function ChromeLocalData(context)
    {
        // constructor
        thisObject = this;
        this.context = context;

        chrome.storage.onChanged.addListener(function(changes, area)
        {
            console.log("local data changed! " + area);
            //console.log(JSON.stringify(changes.frequency));

            for (var key in changes)
            {
                console.log(key);

                if(key == Key.FREQUENCY)
                {
                    console.log(changes[key]);
                    if(thisObject.context)
                        thisObject.context.onLocalDataChanged(key, changes[key].newValue);
                }
                else if(key == Key.REGION)
                {
                    if(thisObject.context)
                        thisObject.context.onLocalDataChanged(key, changes[key].newValue);
                }
            }

            if(thisObject && thisObject.context && thisObject.context.onLocalDataChangeFinish)
            {
                thisObject.context.onLocalDataChangeFinish();
            }

        });

    }

    /**
     * Store Data
     * @param frequencyValue
     * @param regionValue
     * @param debug
     * @param callback
     */
    ChromeLocalData.prototype.storeData = function(frequencyValue, regionValue, debug, callback)
    {
        if(!frequencyValue || !regionValue)
        {
            console.write("no data!");
            return;
        }

        console.log("freq = " + frequencyValue + ", region = " + regionValue + ", debug = "  + debug);

        chrome.storage.local.set({ "frequency" : frequencyValue, "region" : regionValue, "debug": debug }, function()
        {
            console.log("data saved");
            if(callback)
            {
                callback();
            }
        });


    };

    /**
     * Get local data
     * @param key
     * @param callback
     */
    ChromeLocalData.prototype.getLocalData = function(key, callback)
    {
        chrome.storage.local.get(function(item)
        {
            //console.log(item[key]);
            if(callback)
            {
                callback(item[key]);
            }

        });

    };


    /**
     * Clear local storage data
     */
    ChromeLocalData.prototype.clear = function()
    {
        chrome.storage.local.clear(function(callback)
        {
            console.log("local data cleared!");
            if(callback)
            {
                callback();
            }
        });
    };

    //this.clear();
    return ChromeLocalData;
})();