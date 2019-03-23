export function getJSON(url, successCallback) {
    let xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', url, true);
    xobj.responseType = 'json';
    xobj.onreadystatechange = function() {
        // console.log(xobj.readyState === 4, xobj.status == "200");
        if (xobj.readyState === 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            successCallback(xobj.responseText);
        }
    };
    xobj.send();
}

export function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

export function getMinOfArray(numArray) {
    return Math.min.apply(null, numArray);
}