define([
    'underscore',      
    'ueberDB',
    'nconf',
    './designs'
  ], function(_, ueberDB, nconf, Designs) {

    var DesignAPI = function(app) {

      var dbType = nconf.get('dbType') || 'sqlite';

      // Get all the user's designs
      app.get(/^\/api\/([\w._-]+)\/designs\/?$/, function(req, res) {

        var username = decodeURIComponent(req.params[0]);

        var db = new ueberDB.database(dbType, {filename: 'db/' + username + '.db'});
        db.init(function(err) {
          if (err) {
            return res.json(500, err);
          }

          Designs.getAll(db, username, function(err, list) {
            if (err) {
              res.json(500, err);
            } else if (list === null) {
              res.json(200, []);
            } else {
              res.json(200, list);
            }
          });
        });

      });

      // Get the design refs
      app.get(/^\/api\/([\w._-]+)\/design\/([\w%]+)\/?$/, function(req, res) {

        var username = decodeURIComponent(req.params[0]);
        var design = decodeURIComponent(req.params[1]);

        var db = new ueberDB.database(dbType, {filename: 'db/' + username + '.db'});
        db.init(function(err) {
          if (err) {
            return res.json(500, err);
          }

          Designs.get(db, username, design, function(err, refs) {
            if (err) {
              res.json(500, err);
            } else if (refs === null) {
              res.json(404, 'not found');
            } else {
              res.json(refs);
            }
          });
        });

      });

      // Create a new design
      app.post(/^\/api\/([\w._-]+)\/design\/?$/, function(req, res) {
        
        var username = decodeURIComponent(req.params[0]);
        var design = req.body.name && req.body.name.trim();
        if (design === undefined) {
          res.json(400, {errors: [{missing: 'name'}]});
          return;
        }
        if (!Designs.validate(design)) {
          res.json(400, {errors: [{invalid: 'name'}]});
          return;
        }

        var db = new ueberDB.database(dbType, {filename: 'db/' + username + '.db'});
        db.init(function(err) {
          if (err) {
            return res.json(500, err);
          }

          Designs.get(db, username, design, function(err, value) {
            if (err) {
              res.json(500, err);
              return;
            } 
            if (value !== null) {
              res.json(409, 'design already exists');
              return;
            } 

            Designs.create(db, username, design, function(err, obj) {
              if (err) {
                res.json(500, err);
              } else {
                res.json(201, obj);
              }
            });

          });
        });

      });

      // Delete
      app.delete(/^\/api\/([\w._-]+)\/design\/([\w%]+)\/?$/, function(req, res) {

        var username = decodeURIComponent(req.params[0]);
        var design = decodeURIComponent(req.params[1]);

        var db = new ueberDB.database(dbType, {filename: 'db/' + username + '.db'});
        db.init(function(err) {
          if (err) {
            return res.json(500, err);
          }

          Designs.del(db, username, design, function(err) {
            if (err === 'notFound') {
              res.json(404, 'not found');
            } else if (err) {
              res.json(500, err);
            } else {
              res.json('ok');
            }
          });
        });

      });

      // Update ref
      app.put(/^\/api\/([\w._-]+)\/design\/([\w%]+)\/refs\/(\w+)\/(\w+)\/?$/, function(req, res) {

        var username = decodeURIComponent(req.params[0]);
        var design = decodeURIComponent(req.params[1]);
        var type = req.params[2];
        var ref = req.params[3];
        var newRef = req.body;
        if (!(_.isString(newRef) || (_.isObject(newRef) && newRef.hasOwnProperty('commit')))) {
          res.json(400, {errors: ['value must be a JSON string or a commit object']});
          return;
        }

        if (_.isString(newRef)) {
          if (newRef.length !== 40) {
            res.json(400, {errors: ['value must be a 160bit (40 character) SHA']});
            return;
          }
        } else {
          if (newRef.commit.length !== 40) {
            res.json(400, {errors: ['commit must be a 160bit (40 character) SHA']});
            return;
          }
        }

        var db = new ueberDB.database(dbType, {filename: 'db/' + username + '.db'});
        db.init(function(err) {
          if (err) {
            return res.json(500, err);
          }

          Designs.updateRef(db, username, design, type, ref, newRef, function(err) {
            if (err === 'notFound') {
              res.json(404, 'not found');
            } else if (err) {
              res.json(500, err);
            } else {
              res.json('ok');
            }
          });
        });

      });

      // Rename
      app.post(/^\/api\/([\w._-]+)\/design\/([\w%]+)\/?$/, function(req, res) {

        var username = decodeURIComponent(req.params[0]);
        var design = decodeURIComponent(req.params[1]);
        var newName = req.body.newName && req.body.newName.trim();
        if (newName === undefined) {
          res.json(404, {errors: [{missing: 'newName'}]});
          return;
        }

        var db = new ueberDB.database(dbType, {filename: 'db/' + username + '.db'});
        db.init(function(err) {
          if (err) {
            return res.json(500, err);
          }
          
          Designs.rename(db, username, design, newName, function(err) {
            if (err === 'notFound') {
              res.json(404, 'not found');
            } else if (err === 'alreadyExists') {
              res.json(409, 'already exists');
            } else if (err) {
              res.json(500, err);
            } else {
              res.json('ok');
            }
          });
        });
      });
    };

    return DesignAPI;

  });