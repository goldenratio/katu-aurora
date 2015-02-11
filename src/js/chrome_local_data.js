/**
 * @author: Karthik VJ
 **/

var Key = new function()
{
    this.FREQUENCY = "frequency";
    this.REGION = "region";
    this.DEBUG = "debug";
};
var ChromeLocalData = function(context)
{

    var thisObject = this;
    this.context = context;


    chrome.storage.onChanged.addListener(function(changes, area)
    {
        console.log("local data changed! " + area)
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
            console.log("brrrr");
            thisObject.context.onLocalDataChangeFinish();
        }



    });

    this.storeData = function(frequencyValue, regionValue, debug, callback)
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

    this.getLocalData = function(key, callback)
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
    this.clear = function()
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

};