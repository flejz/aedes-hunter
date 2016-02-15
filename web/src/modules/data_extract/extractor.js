'use strict';

const
  fs = require('fs'),
  shp = require('shpjs'),
  p   = require('path'),
  arcgis = require('terraformer-arcgis-parser');

/**
 * prepares the geojson json data to return
 * @features the geoson
 */
let _prepareData = function(geoJson) {

  let features = arcgis.convert(geoJson),
    headers = [],
    values = [];


  for (var i in features) {
    let feature = features[i],
      row = [];

    // executes once - adds the headers

    if (headers.length === 0) {
      for (var header in feature.attributes) {
        headers.push(header);
      }

      // the last header will always be the geometry
      headers.push('SHAPE');
    }

    // adds the values and the geometry
    for (var hdr in feature.attributes) {
      row.push(feature.attributes[hdr]);
    }

    row.push(feature.geometry);

    // adds the row to the values array
    values.push(row);
  }

  let returnFormat = {
    'headers': headers,
    'values': values
  };

  return returnFormat;
};

module.exports = {

  /**
   * Confirms the extract operation from a buffer
   * @param  buffer  a buffer
   * @return the esri formatted geometries
   */
  confirmFromBuffer: function(buffer) {

    return new Promise(function(resolve, reject) {

      if (!buffer) {
        reject(new Error('Caminho do arquivo não informado'));
        return;
      }

      // reads the file buffer
      shp(buffer).then(function(geoJson) {

        try {

          // rejects if the shapefile does not have features
          if (!geoJson.features.length) {
            let err = new Error('O arquivo não tem feições.');
            reject(err);
            return;
          }

          // preparing the data and resolves
          resolve(_prepareData(geoJson));

        } catch (err) {

          reject(err);
        }

      });

    });
  },

  /**
   * Confirms the extract operation from a file path
   * @param  buffer  a file path
   * @return the esri formatted geometries
   */
  confirmFromFile: function(path) {
    let self = this;

    return new Promise(function(resolve, reject) {

      if (!path) {
        reject(new Error('Caminho do arquivo não informado'));
        return;
      }

      // read the zip
      fs.readFile(path, function(err, buffer) {

        // confirms from buffer
        self.confirmFromBuffer(buffer).then(function(formattedData) {

          // resolves the formatted data
          resolve(formattedData);

        }, function(err) {
          reject(err);
        });
      });
    });
  },

  /**
   * Extract shapefile from buffer
   * @buffer the zip file buffer
   * @path   the path to return
   */
  fromBuffer: function(buffer, path) {

    return new Promise(function(resolve, reject) {


      // reads the file buffer
      shp(buffer).then(function(geoJson) {

          //fs.writeFileSync('data/geojson.json', JSON.stringify(geoJson));

        try {

          // rejects if the shapefile does not have features
          if (!geoJson.features.length) {
            let err = new Error('O arquivo não tem feições.');
            reject(err);
            return;
          }

          let
            properties = geoJson.features[0].properties,
            headers = [];

          for (var key in properties)
            headers.push(key);

          // resolve with the headers and the path
          // the <textarea> encapsulation is compulsory to works with
          // dojo iframe element to the file post request
          resolve('<textarea>' +
            JSON.stringify({
              headers: headers,
              file: p.basename(path)
            }) +
            '</textarea>');

        } catch (err) {
          reject(err);
        }
      },
      function(err) {

        // rejects
        reject(err);
      });
    });
  },

  /**
   * Extract shapefile from path
   * @path   the zip shapefile path
   */
  fromFile: function(path) {
    let self = this;

    return new Promise(function(resolve, reject) {

      // read a zip file
      fs.readFile(path, function(err, buffer) {

        // throws error
        if (err) {
          reject(err);
          return;
        }

        // get headers from buffer
        return self.fromBuffer(buffer, path).then(function(res) {

          resolve(res);

        }, function(err) {

          reject(err);

        });
      });
    });
  }
};
