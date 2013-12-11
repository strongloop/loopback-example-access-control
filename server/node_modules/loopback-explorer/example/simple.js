var loopback = require('loopback');
var app = loopback();
var explorer = require('../');

var Product = loopback.Model.extend('product');
Product.attachTo(loopback.memory());
app.model(Product);

app.use(loopback.rest());
app.use('/explorer', explorer(app));

app.listen(3000);
