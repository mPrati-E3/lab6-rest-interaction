import Task from "./task.js";

// API to get all the tasks filtered by the side bar
async function getTasks(filter){
    let url = "/tasks";
    if(filter){
        const queryParams = "?filter=" + filter;
        url += queryParams;
    }
    // I'll fetch the response from the server (GET) with the url specified by the filter (es. all tasks, all important tasks, ...)
    // This function is async so I have to wait for his result
    // Even the response from the server (in json format) is async so I have to wait also that
    const response = await fetch(url);
    const tasksJson = await response.json();
    if(response.ok){
        // I will map the result in json format into my exam format
        return tasksJson.map((t) => Task.from(t));
    } else {
        throw jsonexams;  // An object with the error coming from the server
    }
}

async function addTask(task) {
    return new Promise((resolve, reject) => {
        fetch('/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task),
        }).then( (response) => {
            if(response.ok) {
                resolve(null);
            } else {
                // analyze the cause of error
                response.json()
                .then( (obj) => {reject(obj);} ) // error msg in the response body
                .catch( (err) => {reject({ errors: [{ param: "Application", msg: "Cannot parse server response" }] }) }); // something else
            }
        }).catch( (err) => {reject({ errors: [{ param: "Server", msg: "Cannot communicate" }] }) }); // connection errors
    });
}

// Modify a task using a new one given by param
async function updateTask(task) {
    // Here I have to use the PUT (not the GET) so I have to insert my fetch into a Promise
    return new Promise((resolve, reject) => {
        // I will fetch the result from the server but, becuse this is a PUT, I have to manually build the fetch
        fetch('/tasks/' + task.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            // I will transform my task type into the json format so the server can read it
            body: JSON.stringify(task),
        }).then( (response) => {
            if(response.ok) {
                resolve(null);
            } else {
                // analyze the cause of error
                response.json()
                .then( (obj) => {reject(obj);} ) // error msg in the response body
                .catch( (err) => {reject({ errors: [{ param: "Application", msg: "Cannot parse server response" }] }) }); // something else
            }
        }).catch( (err) => {reject({ errors: [{ param: "Server", msg: "Cannot communicate" }] }) }); // connection errors
    });
}

// Method to delete a task (id is given)
async function deleteTask(taskId) {
    // Similar to PUT, i have to include my fetch into a Promise
    return new Promise((resolve, reject) => {
        // Similar to PUT, I will manually build my fetch but it's easier because i can use the DELETE
        fetch('/tasks/' + taskId, {
            method: 'DELETE'
        }).then( (response) => {
            if(response.ok) {
                resolve(null);
            } else {
                // analyze the cause of error
                response.json()
                .then( (obj) => {reject(obj);} ) // error msg in the response body
                .catch( (err) => {reject({ errors: [{ param: "Application", msg: "Cannot parse server response" }] }) }); // something else
            }
        }).catch( (err) => {reject({ errors: [{ param: "Server", msg: "Cannot communicate" }] }) }); // connection errors
    });
}




export {getTasks, addTask, deleteTask, updateTask};