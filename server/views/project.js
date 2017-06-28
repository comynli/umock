'use strict';
var app = global.app;
var Result = require("../utils/result");
var Util = require("../utils/util");
var urlencoded = require('body-parser').urlencoded({limit: '50mb', extended: true});

var view = function(mockServer, db) {


    const config = global.config;
    var reInitProjects = function() {};

    if (config['mongo']) {



        var ProjectSchema = new db.Schema({
            url: String,
            desc: String,
            result: String,
            dataHandler: {type:String,default: "over"},//over覆盖,overlying叠加
            type: {type:String,default: "GET"},
            isreg: {type:Boolean,default:false},
            param: String,
            respParam:String,
            menuId:String,
            private: {type:Number,default: 0},
            swagger:String,
            projectId:String,
            active: {type:Boolean,default: true},
            createTime: {type:Date,default: Date.now},
            modifyTime: {type:Date,default: Date.now}
        });

        let ProjectModel = db.model('projectSet', ProjectSchema);

        app.get('/umock/project/list', (req, res, next) => {
            ProjectModel.find().exec((err, docs) => {
                res.send(Result.R(docs));
            });
        });

        app.get('/umock/project/:id', (req, res, next) => {
            ProjectModel.find({
                "_id": req.params.id
            }).exec((err, docs) => {
                res.send(Result.R(docs));
            });
        });

        app.post('/umock/project', (req, res, next) => {
            let query = getProjectModel(req.body);
            var mongooseEntity = new ProjectModel(query);
            mongooseEntity.save(function(error, data) {
                if (error) {
                    console.error(error);
                    res.send(Result.defaultError("保存失败"));
                } else {
                    reInitProjects();
                    res.send(Result.R(data));
                }
            });
        });

        app.post('/umock/project/:id', (req, res, next) => {
            var conditions = {
                _id: req.params.id
            };
            var update = {
                $set: getProjectModel(req.body)
            };
            ProjectModel.update(conditions, update, function(error, data) {
                if (error) {
                    res.send(Result.defaultError("保存失败"));
                } else {
                    reInitProjects();
                    res.send(Result.R(data));
                }
            });
        });

        app.delete('/umock/project/:id', (req, res, next) => {
            var conditions = {
                _id: req.params.id
            };
            ProjectModel.remove(conditions, function(error) {
                if (error) {
                    res.send(Result.defaultError("删除失败"));
                } else {
                    reInitProjects();
                    res.send(Result.defaultResult);
                }
            });
        });

        reInitProjects = function() {
            ProjectModel.find().exec((err, docs) => {
                var listO = {},
                    listId = {};
                docs.forEach((n, i) => {
                    // if (listO[n.beginPath] == undefined) listO[n.beginPath] = {};
                    listO[n.beginPath] = n;
                    listId[n._id] = n;
                });
                mockServer.projects = listO;
                mockServer.projectIds = listId;
            });
        };
    } else if(config['pouchdb']){

        app.get('/umock/project/list', (req, res, next) => {
            db.allDocs({
                include_docs: true
            }).then(function(docs) {
                let projects = [];
                if (docs.total_rows > 0) {
                    projects = docs.rows.map(function(item) {
                        return item.doc;
                    });
                }
                res.send(Result.R(projects));
            }).catch(function(err) {
                console.log(err);
            });
        });

        app.get('/umock/project/:id', (req, res, next) => {
            db.get(req.params.id).then(function(response) {
                res.send(Result.R([response]));
            });
        });

        app.post('/umock/project', (req, res, next) => {
            let query = getProjectModel(req.body);
            db.post(query).then(function(response) {
                reInitProjects();
                res.send(Result.R(Util.extend(query, formatResp(response))));
            }).catch(function(err) {
                console.log(err);
            });
        });

        app.post('/umock/project/:id', (req, res, next) => {
            db.get(req.params.id).then(function(doc) {
                var newData = Util.extend(getProjectModel(req.body), {
                    _id: doc._id,
                    _rev: doc._rev
                });
                return db.put(newData);
            }).then(function(docs) {
                reInitProjects();
                let projects = [];
                if (docs.total_rows > 0) {
                    projects = docs.rows.map(function(item) {
                        return item.doc;
                    });
                }
                res.send(Result.R(projects));
            }).catch(function(err) {
                console.log(err);
            });
        });


        app.delete('/umock/project/:id', (req, res, next) => {
            db.get(req.params.id).then(function(doc) {
                return db.remove(doc);
            }).then(function(response) {
                res.send(Result.defaultResult);
            })
        });

        reInitProjects = function() {
            db.allDocs({
                include_docs: true
            }).then(function(docs) {
                var listO = {},
                    listId = {};
                docs.rows.forEach((n, i) => {
                    // if (listO[n.beginPath] == undefined) listO[n.beginPath] = {};
                    listO[n.doc.beginPath] = n.doc;
                    listId[n.doc._id] = n.doc;
                });
                mockServer.projects = listO;
                mockServer.projectIds = listId;
            });
        };
    }else{

        let getOne = function(id,res){
            db.query(`SELECT * from project where id = ${id}`, function(err, rows, fields) {
                if (err){
                    console.log(err);
                    res.send(Result.defaultError("失败"));
                    return;
                }
                res.send(Result.R(rows[0]));
            });
        }
        
        app.get('/umock/project/list', (req, res, next) => {
 
            db.query('SELECT * from project', function(err, rows, fields) {
              if (err){
                console.log(err);
                res.send(Result.defaultError("失败"));
                return;
              }
              res.send(Result.R(rows));
            });
        });

        app.get('/umock/project/:id', (req, res, next) => {
            db.query(`SELECT * from project where id = ${req.params.id}`, function(err, rows, fields) {
              if (err){
                console.log(err);
                res.send(Result.defaultError("失败"));
                return;
              }
              res.send(Result.R(rows.length==0?null:rows[0]));
            });
        });

        app.post('/umock/project', (req, res, next) => {
            let query = getProjectModel(req.body);
            db.query(`INSERT INTO project SET ?`,query, function(err, rows, fields) {
              if (err) {
                    console.log(err);
                    res.send(Result.defaultError("保存失败"));
                } else {
                    reInitProjects();
                    getOne(rows.insertId,res);
                }
            });
        });

        app.post('/umock/project/:id', (req, res, next) => {
            let query = getProjectModel(req.body);
            db.query(`update project SET ? where id = ${req.params.id}`,query, function(err, rows, fields) {
              if (err) {
                    console.log(err);
                    res.send(Result.defaultError("更新失败"));
                } else {
                    reInitProjects();
                    res.send(Result.R(rows));
                }
            });
        });

        app.delete('/umock/project/:id', (req, res, next) => {
            db.query(`delete from project where id = ${req.params.id}`, function(err, rows, fields) {
              if (err) {
                    console.log(err);
                    res.send(Result.defaultError("删除失败"));
                } else {
                    reInitProjects();
                    res.send(Result.R(rows));
                }
            });
        });

        reInitProjects = function() {
            db.query(`select * from project`, function(err, rows, fields) {
                if (err){
                  console.log(err);
                  return;
                }
                var listO = {},
                    listId = {};
                rows.forEach((n, i) => {
                    // if (listO[n.beginPath] == undefined) listO[n.beginPath] = {};
                    listO[n.beginPath] = n;
                    listId[n.id] = n;
                });
                mockServer.projects = listO;
                mockServer.projectIds = listId;
            });
        };
    }

    let formatResp = (resp) => {
        var data = resp;
        if (data.id != undefined) data._id = data.id;
        if (data.rev != undefined) data._rev = data.rev;
        return data;
    };

    let getProjectModel = (body) => {
        var data = {};
        if (body.name != undefined) data.name = body.name;
        if (body.description != undefined) data.description = body.description;
        if (body.rewrite != undefined) data.rewrite = body.rewrite;
        if (body.isPublic != undefined) data.isPublic = body.isPublic;
        if (body.beginPath != undefined) data.beginPath = body.beginPath;
        if (body.swagger != undefined) data.swagger = body.swagger;
        if (body.private != undefined) data.private = body.private;
        if (body.proxy != undefined) data.proxy = body.proxy;
        data.modifyTime = new Date();
        return data;
    };

    reInitProjects();

}

module.exports = view;