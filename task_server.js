//import express
const express = require('express');
const dao = require('./task_dao');
const morgan = require('morgan'); // logging middleware

//create application
const app = express(); 
const port = 3000;

// Set-up logging
app.use(morgan('tiny'));

// Process body content
app.use(express.json());

// Set-up the 'client' component as a static website
app.use(express.static('client'));
app.get('/', (req, res) => res.redirect('/index.html'));
 
// REST API endpoints

//GET /tasks
app.get('/tasks', (req, res) => {
    dao.getTasks(req.query.filter)
        .then((tasks) => {
            res.json(tasks);
        })
        .catch((err) => {
            res.status(500).json({
                errors: [{'msg': err}],
             });
       });
});

//GET /tasks/<taskId>
app.get('/tasks/:taskId', (req, res) => {
    dao.getTask(req.params.taskId)
        .then((course) => {
            if(!course){
                res.status(404).send();
            } else {
                res.json(course);
            }
        })
        .catch((err) => {
            res.status(500).json({
                errors: [{'param': 'Server', 'msg': err}],
            });
        });
});

//POST /tasks
app.post('/tasks', (req,res) => {
    const task = req.body;
    if(!task){
        res.status(400).end();
    } else {
        dao.createTask(task)
            .then((id) => res.status(201).json({"id" : id}))
            .catch((err) => res.status(500).json({
                errors: [{'param': 'Server', 'msg': err}],
            }));
    }
});

//DELETE /tasks/<taskId>
app.delete('/tasks/:taskId', (req,res) => {
    dao.deleteTask(req.params.taskId)
        .then((result) => res.status(204).end())
        .catch((err) => res.status(500).json({
            errors: [{'param': 'Server', 'msg': err}],
        }));
});

//PUT /tasks/<taskId>
app.put('/tasks/:taskId', (req,res) => {
    if(!req.body.id){
        res.status(400).end();
    } else {
        const task = req.body;
        dao.updateTask(req.params.taskId,task)
            .then((result) => res.status(200).end())
            .catch((err) => res.status(500).json({
                errors: [{'param': 'Server', 'msg': err}],
            }));
    }
});


//activate server
app.listen(port, () => console.log('Server ready'));
