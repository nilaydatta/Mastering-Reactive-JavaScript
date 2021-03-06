let Rx = require('rx');
let dataSource = require('./data_source');
let services = require('./services')(dataSource);

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

http.listen(3000,()=>console.log('Server listening on port 3000'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

Rx.Observable.fromEvent(io,'connection')
  .subscribe(function(client) {
    let observable = null;
    Rx.Observable.fromEvent(client, 'request')
      .map((payload)=>JSON.parse(payload))
      .flatMapLatest((payload)=> {
        let serviceObservable = services[payload.service](payload,observable);
        if(serviceObservable){
          observable = serviceObservable;
        }
        return observable;
      })
      .takeUntil(Rx.Observable.fromEvent(client,'disconnect'))
      .subscribe(data => client.emit('message',data));
  });



