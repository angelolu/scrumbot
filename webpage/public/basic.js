// TODO: Reduce use of global variables

// Write version
document.getElementById("version").innerHTML = "v1.10";

// Initialize Firebase with config (not on github)
firebase.initializeApp(config);
var db = firebase.firestore();

// Initializa variables
var feedDate = null;
var cups = null;
var currentcolor = 1;

// Time in lastfeed is stored as GMT
// Everywhere else on firestore it is EST
// FIX THIS AT SOME POINT!!

// Listen for feed events
db.collection("lastfeed").doc("info")
.onSnapshot(function(doc) {
    if (doc.exists) {
        timeParts = doc.data()["time"].split('-');
        feedDate = new Date(timeParts[0], timeParts[1]-1, timeParts[2], timeParts[3], timeParts[4], timeParts[5]);
        cups = doc.data()["cups"];
        tick(); // Trigger main card update without waiting for timer
        loadAdditonalStats(); // Since lastfeed/info was changed, the database probably has new feed events to load
    } else {
        console.log("Could not load lastfeed/info!");
    }
});

// Each time new data is loaded, also retreive/calculate additional statistics
function loadAdditonalStats(){
    // Get current date
    var nowDate = new Date(Date.now());
    // Correct to UTC
    var utc = nowDate.getTime() - (nowDate.getTimezoneOffset() * 60000);
    // Get time in EST
    nowDate = new Date(utc + (3600000*(-4)));
    
    var logref = db.collection("feedlog"); // Where the feed history is stored
    
    // Get total cups today
    var dateString = makeDateString(nowDate);
    var query = logref.where("date", "==", dateString);
    query.get()
    .then(function(querySnapshot) {
        var cupsToday = 0;
        querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            cupsToday = cupsToday + parseInt(doc.data()["cups"]);
        });
        document.getElementById("card_today").innerHTML = cupsToday;
    })
    .catch(function(error) {
        console.log("Error loading total cups today: ", error);
    });
    
    // Get total cups this week
    // Make a date object corresponding to sunday
    var sunday = new Date(utc + (3600000*(-4)) - (86400000* nowDate.getDay()));
    dateString = makeDateString(sunday);
    // Get all feed events after Sunday (this week so far)
    query = logref.where("date", ">=", dateString);
    query.get()
    .then(function(querySnapshot) {
        var cupsThisWeek = 0;
        querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            cupsThisWeek = cupsThisWeek + parseInt(doc.data()["cups"]);
        });
        document.getElementById("card_week").innerHTML = cupsThisWeek;
    })
    .catch(function(error) {
        console.log("Error loading total cups this week: ", error);
    });
    
    // Get last bag weight
    var bagWeight = 0;
    var bagDate;
    var bagref = db.collection("foodlog");
    query = bagref.orderBy("date").limit(2)
    query.get()
    .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            bagWeight = bagWeight + parseInt(doc.data()["weight"]);
            bagDate = doc.data()["date"];
        });
        // We now have the second last bag date and the weight of the last two bags combined
        // TODO: deal with edge case where more than 2 bags are bought
        // Get all the feed events since the second last bag was bought
        query = logref.where("date", ">=", bagDate);
        query.get()
        .then(function(querySnapshot) {
            var cupsTotal = 0;
            querySnapshot.forEach(function(doc) {
                cupsTotal = cupsTotal + parseInt(doc.data()["cups"]);
            });
            document.getElementById("card_weight").innerHTML = bagWeight - (cupsTotal * 30);
            document.getElementById("card_scoops_left").innerHTML = Math.floor((bagWeight - (cupsTotal * 30))/30);
            document.getElementById("card_days_left").innerHTML = Math.floor((bagWeight - (cupsTotal * 30))/(30*4));
        })
        .catch(function(error) {
            console.log("Error calculating remaining feed: ", error);
        });
        
    })
    .catch(function(error) {
        console.log("Error getting last bags of food: ", error);
    });
    
}

// function that creates a string describing a date in the same 
// format as saved in firestore. This allows for searching for events before/after this date
function makeDateString(myDate){
    var dateString = myDate.getFullYear() + "";
    if(myDate.getMonth() + 1 < 10){
        dateString = dateString.concat("0"+ (myDate.getMonth() + 1));
    }else{
        dateString = dateString.concat((myDate.getMonth() + 1));
    }
    if(myDate.getDate() < 10){
        dateString = dateString.concat("0"+ myDate.getDate());
    }else{
        dateString = dateString.concat(myDate.getDate());
    }
    //console.log("Made datestring " + dateString);
    return dateString;
}

// Function to update the main box every second
function tick(){
    if(feedDate != null){
        var nowDate = new Date(Date.now());
        // Correct time to GMT
        nowDate = new Date(Date.now() + feedDate.getTimezoneOffset() * 60000);
        var elapsedTime = Math.floor(((nowDate - feedDate))/1000); // The elapsed time in seconds
        
        // Display last feed info in a grammatically sound way
        if(elapsedTime >= 0){
            var largeText = null;
            if(elapsedTime > 7200){
                largeText = Math.floor(elapsedTime/3600) + " hours ago";
            }else if(elapsedTime > 3600){
                largeText = "About an hour ago";
            }else if(elapsedTime == 1){
                largeText = "1 second ago";
            }else if(elapsedTime < 60){
                largeText = elapsedTime + " seconds ago";
            }else if(elapsedTime < 120){
                largeText = "1 minute ago";
            }else{
                largeText = Math.floor(elapsedTime/60) + " minutes ago";
            }
            
            document.getElementById("main_desc").innerHTML = "Scrum God was last fed";
            document.getElementById("main_title").innerHTML = largeText;
            if(cups == 1){
                document.getElementById("main_sub").innerHTML = "1 scoop at " + new Date(feedDate - feedDate.getTimezoneOffset() * 60000).toLocaleString();
            }else{
                document.getElementById("main_sub").innerHTML = cups + " scoops at " + new Date(feedDate - feedDate.getTimezoneOffset() * 60000).toLocaleString();
            }
            
            // Update the background of the page depending on how long it's been since last feed
            if(Math.floor(elapsedTime/3600) >= 8){
                if(currentcolor != 3){
                    document.getElementById('bg').style.backgroundImage = 'linear-gradient(to bottom right, #B71C1C, #7B1FA2)';
                    currentcolor = 3;
                }
            }else if(Math.floor(elapsedTime/3600) >= 4){
                if(currentcolor != 4){
                    document.getElementById('bg').style.backgroundImage = 'linear-gradient(to bottom right, #7B1FA2, #283593)';
                    currentcolor = 4;
                }
            }else if(currentcolor != 2){
                document.getElementById('bg').style.backgroundImage = 'linear-gradient(to bottom right, #311B92, #01579B)';
                currentcolor = 2;
            }
        }
    }else{
        // Waiting for data...
        document.getElementById("main_desc").innerHTML = "";
        document.getElementById("main_title").innerHTML = "loading data...";
        document.getElementById("main_sub").innerHTML = "";
    }
}

// Update the page on load
tick();

// Update the main box every second
var t = setInterval(tick,1000);

// Initialize service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/servw.js').then(function(registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Online/offline detection
window.addEventListener('online', function(e) {
    // Re-sync data with server.
    var offlinebar = document.getElementById('offline_bar');
    offlinebar.style.visibility = "hidden";
    offlinebar.style.height = "0";
}, false);

window.addEventListener('offline', function(e) {
    // Queue up events for server.
    var offlinebar = document.getElementById('offline_bar');
    offlinebar.style.visibility = "visible";
    offlinebar.style.height = "auto";
}, false);

