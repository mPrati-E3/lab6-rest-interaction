'use strict';

import * as Api from './api.js';

class Filter{
    constructor() {}
    
    /**
     * Function to create the <ul></ul> list of tasks
     * @param {*} filterType an optional filter
     */
    async showTasks(filterType){
        const taskList = document.getElementById("taskList");
        const filterTitle = document.getElementById("filter-title");
        this.clearTasks();
        let tasks;

        // I'll switch the filterType to understand which tasks I have to write in my table
        switch(filterType){
            case "filter-all":
                tasks = await Api.getTasks();
                filterTitle.innerText = "All";
                break;
            case "filter-important":
                tasks = await Api.getTasks('important');
                filterTitle.innerText = "Important";
                break;
            case "filter-today":
                tasks = await Api.getTasks('today');
                filterTitle.innerText = "Today";
                break;
            case "filter-week":
                tasks = await Api.getTasks('week');
                filterTitle.innerText = "Next 7 Days";
                break;
            case "filter-private":
                tasks = await Api.getTasks('private');
                filterTitle.innerText = "Private";
                break;
            case "filter-shared":
                tasks = await Api.getTasks('shared');;
                filterTitle.innerText = "Shared With...";
                break;
            default:
                tasks = await Api.getTasks(filterType);
                filterTitle.innerText = filterType;
        }

        //visualize tasks
        for(const task of tasks){
            const taskNode = this.createTaskNode(task);
            taskList.appendChild(taskNode);
            // set a timeout to mark the deadline, if the deadline is "valid"
            // if I'm out of time to complete a task, the task will be colored
            const now = moment();
            if(task.deadline && task.deadline.isValid() && task.deadline.isAfter(now) ) {

                console.log(task.id + " -- " + task.deadline.diff(now));

                setTimeout(function() {
                    const li = document.getElementById("task" + task.id);
                    const date = li.getElementsByClassName("date")[0];
                    date.classList.add('bg-danger');
                    date.classList.add('text-white');
                }, task.deadline.diff(now), task);
            }
        }

    }

    // For every task displayed, I'll show the corresponding project
    async showProjects(){
        const projectList = document.getElementById("projects");
        this.clearProjects();

        //get all tasks to visualize projects
        const tasks = await Api.getTasks();

        //build and visualize projects
        for(const project of [...new Set(tasks.map(task => task.project))]){
            if(project){
                const projectNode = this.createProjectNode(project);
                projectList.appendChild(projectNode);
            }
        }
    }

    /**
     * Function to create a single task encolsed in an <li> tag
     * @param {*} task the task object
     */
    createTaskNode(task){

        // create the li
        const li = document.createElement('li');
        li.id = "task"+task.id;
        li.className = 'list-group-item';

        // create the inner div
        const innerDiv = document.createElement('div');
        innerDiv.className = 'custom-control custom-checkbox';

        // create the external div
        const externalDiv = document.createElement('div');
        externalDiv.className = 'd-flex w-100 justify-content-between';
        
        // create the checkboxes (important and completed)
        // I'll add them to the innerDiv after the event listener
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = "check-t"+ task.id;
        if(task.important)
            checkbox.className = 'custom-control-input important';
        else
            checkbox.className = 'custom-control-input';
        if(task.completed)
            checkbox.checked = true;
        else 
            checkbox.checked = false;
        
        //event lister to mark the task as completed (or not completed)
        checkbox.addEventListener('change', event => {
            if(event.target.checked)
                task.completed = true;
            else 
                task.completed = false;
            
                // I'll call the API to update the task in my database (passing via server)
                // this call is async so i have to use then
                Api.updateTask(task) 
                .then(() => {

                    //remove errors, if any
                    document.getElementById('errorMsg').innerHTML = '';

                    //refresh the user interface
                    this.filterView.clearTasks();
                    this.filterView.showTasks('filter-all');
                    this.filterView.clearProjects();
                    this.filterView.showProjects();

                    //reset the form and close the modal
                    addForm.reset();
                    document.getElementById("closeModal").click();

                })
                .catch((errorObj) => {
                    if (errorObj) {
                        const err0 = errorObj.errors[0];
                        const errorString = err0.param + ': ' + err0.msg;
                        // add an alert message in DOM
                        document.getElementById('errorMsg').innerHTML = `
                            <div class="alert alert-danger alert-dismissible fade show" role="danger">
                                <strong>Error:</strong> 
                                <span>${errorString}</span> 
                                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>`;
                    }
                }); 

        });
        
        innerDiv.appendChild(checkbox);
        
        // create label
        const descriptionText = document.createElement('label');
        descriptionText.className = 'description custom-control-label';
        descriptionText.innerText = task.description;
        descriptionText.htmlFor = "check-t"+ task.id;
        innerDiv.appendChild(descriptionText);
        
        // if my task is into a project, create the project
        if(task.project){
            const projectText = document.createElement('span');
            projectText.className = 'project badge badge-primary ml-4';
            projectText.innerText = task.project;
            innerDiv.appendChild(projectText);
        }

        // insert the innerDiv into the externalDiv
        externalDiv.appendChild(innerDiv);

        // the date is not in the innerDiv but directly into the externalDiv
        if(task.deadline){
            const dateText = document.createElement('small');
            dateText.className = 'date';
            //print deadline - using the format function of Moment js
            dateText.innerText = task.deadline.format("dddd, MMMM Do YYYY, h:mm:ss a"); 
            //mark expired tasks - using the isBefore function of Moment js
            const now = moment();
            if(task.deadline.isBefore(now)){
                dateText.classList.add('bg-danger');
                dateText.classList.add('text-white');
            }
            externalDiv.appendChild(dateText);
        }     

        // create a div dedicated to buttons
        const buttonsDiv = document.createElement('div');

        // create an image using the edit.svg file
        const imgEdit = document.createElement('img');
        imgEdit.width = 20;
        imgEdit.height = 20;
        imgEdit.classList = "img-button";
        imgEdit.src = '../svg/edit.svg';

        //callback to edit a task
        imgEdit.addEventListener('click', event => {
            const addForm = document.getElementById("addForm");
            addForm.elements["form_id"].value = task.id;
            addForm.elements["form_description"].value = task.description;
            addForm.elements["form_project"].value = task.project;
            if(task.important)
                addForm.elements["form_important"].checked = true;
            else
                addForm.elements["form_important"].checked = false;
            if(task.privateTask)
                addForm.elements["form_private"].checked = true; 
            else
                addForm.elements["form_private"].checked = false; 

            if(task.deadline) {
                addForm.elements["form_deadline_date"].value = task.deadline.format("YYYY-MM-DD");
                addForm.elements["form_deadline_time"].value = task.deadline.format("hh:mm");
            }

            document.getElementById("addButton").click();
        });

        // the edit image is a button, so I add that to the dedicated div
        buttonsDiv.appendChild(imgEdit);

        // create an image using the delete.svg file
        const imgDelete = document.createElement('img');
        imgDelete.width = 20;
        imgDelete.height = 20;
        imgDelete.src = '../svg/delete.svg';
        imgDelete.classList = "img-button";

        //callback to delete a task
        imgDelete.addEventListener('click', event => {

            // Here I have to call an API to delete the tasks so I have to wait for that because it's async
            Api.deleteTask(task.id)
            .then(() => {
                this.clearTasks();
                this.showTasks('filter-all');
                this.clearProjects();
                this.showProjects();
            })
            .catch((errorObj) => {
                if (errorObj) {
                    const err0 = errorObj.errors[0];
                    const errorString = err0.param + ': ' + err0.msg;
                    // add an alert message in DOM
                    document.getElementById('errorMsg').innerHTML = `
                        <div class="alert alert-danger alert-dismissible fade show" role="danger">
                            <strong>Error:</strong> <span>${errorString}</span> 
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>`;
                }
            });
        });
       
        // the delete image is a button, so I add that to the dedicated div
        buttonsDiv.appendChild(imgDelete);

        // I'll add the div dedicated to buttons to the externalDiv
        externalDiv.appendChild(buttonsDiv);

        // if the task is private, add a custom image (build by svg) near the task
        if(!task.privateTask){
            innerDiv.insertAdjacentHTML("afterend", `<svg class="bi bi-person-square" width="1.2em" height="1.2em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M14 1H2a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1zM2 0a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2H2z" clip-rule="evenodd"/>
                <path fill-rule="evenodd" d="M2 15v-1c0-1 1-4 6-4s6 3 6 4v1H2zm6-6a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
              </svg> `);
        }

        // add the externalDiv to the parent li
        li.appendChild(externalDiv);

        return li;
    }

    /**
     * Function to destroy the <ul></ul> list of tasks
     */
    clearTasks(){
        const taskList = document.getElementById("taskList");
        taskList.innerHTML = '';
    }


    /**
     * Function to create a single project
     * @param {*} project the project name to be created
     */
    createProjectNode(project){
        const a = document.createElement('a');
        a.className = "list-group-item list-group-item-action";
        a.innerText = project;
        a.setAttribute("data-id", project);
        a.addEventListener('click', () => {
            //remove active class from other filters
            if(document.querySelector("#left-sidebar a.active"))
                document.querySelector("#left-sidebar a.active").classList.remove("active");
            //make the project as the active filter
            a.classList.add("active");

            //call showTasks with the project as a filter
            this.showTasks(project);
        });
        return a;
    }
    
    /**
     * Function to destroy the list of projects in the side menu
     */
    clearProjects(){
        const projectList = document.getElementById("projects");
        projectList.innerHTML = '';
    }

    /**
     * Function to set up callbacks associated with filters
     */
    setUpFilterCallbacks(){
        //set up filter references
        document.querySelectorAll("#left-sidebar a").forEach(link => {
            link.addEventListener("click", (event) => {
                const filterType = event.target.dataset.id;
                if(document.querySelector("#left-sidebar a.active"))
                    document.querySelector("#left-sidebar a.active").classList.remove("active");
                event.target.classList.add("active");
                this.showTasks(filterType);
            });
        }); 
    }

}

export default Filter;