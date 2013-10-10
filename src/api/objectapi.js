define([
    'ueberDB',
    'nconf',
    './objects'
  ],
  function(ueberDB, nconf, Objects) {

    var ObjectAPI = function(app) {

      var dbType = nconf.get('dbType') || 'sqlite';

      // Create graph
      app.post(/^\/api\/([\w._-]+)\/graph\/?$/, function(req, res) {
        var username = decodeURIComponent(req.params[0]);
        create(username, 'graph', req.body, res);
      });

      // Get graph
      app.get(/^\/api\/([\w._-]+)\/graph\/([\w%]+)\/?$/, function(req, res) {
        var username = decodeURIComponent(req.params[0]);
        var sha = req.params[1];
        get(username, 'graph', sha, res);
      });

      // Create vertex
      app.post(/^\/api\/([\w._-]+)\/vertex\/?$/, function(req, res) {
        var username = decodeURIComponent(req.params[0]);
        create(username, 'vertex', req.body, res);
      });

      // Get vertex
      app.get(/^\/api\/([\w._-]+)\/vertex\/([\w%]+)\/?$/, function(req, res) {
        var username = decodeURIComponent(req.params[0]);
        var sha = req.params[1];
        get(username, 'vertex', sha, res);
      });


      var create = function(username, type, object, res) {
        var db = new ueberDB.database(dbType, {filename: 'db/' + username + '.db'});
        db.init(function(err) {
          if (err) {
            return res.json(500, err);
          }
          
          Objects.create(db, username, type, object, function(err, sha) {
            if (err) {
              res.json(500, err);
            } else {
              res.json(201, sha);
            }
          });
        });
      };

      var get = function(username, type, sha, res) {
        var db = new ueberDB.database(dbType, {filename: 'db/' + username + '.db'});
        db.init(function(err) {
          if (err) {
            return res.send(500, err);
          }

          Objects.get(db, username, type, sha, function(err, object) {
            if (err) {
              res.send(500, err);
            } else if (object === null) {
              res.json(404, 'not found');
            } else {
              return res.json(object);
            }
          });
        });
      };

    };

    return ObjectAPI;

  });