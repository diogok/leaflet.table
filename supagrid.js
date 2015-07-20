
Array.prototype.unique = function() {
  var o = {}, i, l = this.length, r = [];
  for(i=0; i<l;i+=1) o[this[i]] = this[i];
  for(i in o) r.push(o[i]);
  return r;
};

var supagrid = function(options){

    var grid = {
      data: [],
      filtered: [],
      fields: [],
      parent: null,
      el: null,
      options: {},
      filters: {}
    };

    var state = {
      idle: true,
      active: false,
      scroll: false,
      dirty: true,
      re: true,
      delta: 6,
      deltaY: 0,
      start: 0,
      max: 0
    };

    function render() {
      requestAnimationFrame(render);
      if(!state.dirty || !state.idle) return;
      state.idle=false;

      grid.el.body.innerHTML="";
      var items=grid.filtered.slice(0);
      for(var i=state.start;i<state.max && i<items.length;i++) {
        var data = items[i];
        if(typeof data == 'undefined') continue;

        var line = document.createElement("tr");
        for(var f=0;f<grid.fields.length;f++) {
          if(typeof data[grid.fields[f]] == 'undefined') {
            data[grid.fields[f]] = "";
          }

          var cell = document.createElement("td");

          var input = document.createElement("input");
          input.type='text';
          input.value= data[grid.fields[f]];
          input.setAttribute("name",grid.fields[f]);

          if(grid.options.id) {
            input.setAttribute('rel',data[grid.options.id]);
          }

          if(typeof grid.options.edit == 'undefined' || grid.options.edit != true) {
            input.setAttribute("readonly","readonly");
          }

          fbind(input,i,f);

          cell.appendChild(input);
          line.appendChild(cell);
        }
        grid.el.body.appendChild(line);
      }

      state.dirty=false;
      state.idle=true;
    }

    function update() {
      if(!state.active || !state.idle) return;
      state.idle=false;

      if(state.scroll || state.re) {
        var dummy = document.createElement("tr");
        dummy.innerHTML = "<td><input type='text' /></td>";
        grid.el.body.appendChild(dummy);
        var lh = dummy.clientHeight;
        if(state.deltaY>=0){
          state.start = Math.floor( state.deltaY / state.delta);
          if(state.start >= grid.filtered.length) {
            state.start = grid.filtered.length - 1;
            state.deltaY -= state.delta;
          }
        } else {
          state.start=0;
          state.deltaY=0;
        }
        if(state.start <0) state.start=0;
        state.max = Math.floor((grid.el.clientHeight)/lh) + 4 + state.start;
        if(state.max == NaN) state.max=1;
        state.dirty=true;
        state.scroll=false;
        state.re=false;
      }
      state.idle=true;
    }

    function focus(id) {
      if(typeof grid.options.id == 'undefined') return;
      
      var items = grid.filtered.slice(0);
      for(var i=0;i<items.length;i++) {
        if(items[i][grid.options.id]+"" == ""+id) {
          state.deltaY = ( i - 1 ) * state.delta;
          state.scroll = true;

          setTimeout(function(){
            grid.el.body.querySelector("input[rel='"+id+"']").focus();
          },1000);
          return;
        }
      }
    }

    function fbind(input,x,y) {
      function updt() {
        grid.filtered[x][grid.fields[y]]=input.value;
      }
      input.addEventListener("change",updt);
      input.addEventListener("keyup",updt);
      input.addEventListener("keydown",updt);
      input.addEventListener("focus",function(evt) {
        var prevFocus = input.parentElement.parentElement.parentElement.querySelector("tr.x-supagrid-focus");
        if(prevFocus != null) prevFocus.setAttribute('class','');
        prevFocus = input.parentElement.parentElement.parentElement.querySelector("input.x-supagrid-focus");
        if(prevFocus != null) prevFocus.setAttribute('class','');
        input.parentElement.parentElement.setAttribute('class','x-supagrid-focus');
        input.setAttribute('class','x-supagrid-focus');

        if(typeof grid.options.onFocus == 'function') {
          grid.options.onFocus(input.getAttribute('rel'));
        }
      });
      input.addEventListener("keypress",function(evt){
        var c = evt.keyCode;
        var k = evt.key;
        if(c == 13 || c == 40 || k == 'Enter' || k == 'Down')  {
          if(x + 1 == grid.filtered.length) {
            return ;
          }
          state.deltaY += state.delta;
          state.scroll = true;
          var to_x=x-state.start+1;
          setTimeout(function(){
            grid.el.getElementsByTagName("input")[(to_x*grid.fields.length) + y].focus();
          },200);
        } else if(c == 38 || k == 'Up') {
          if( x - 1 < 0 ){
            return;
          }
          var to_x=x-state.start+(state.start!=0?+1:0);
          state.deltaY -= state.delta;
          state.scroll = true;
          setTimeout(function(){
            grid.el.getElementsByTagName("input")[(to_x*grid.fields.length) + y].focus();
          },200);
        }
      });
    }

    function bind() {
      grid.el.addEventListener('wheel',function(evt) {
        state.deltaY+=evt.deltaY;
        state.scroll=true;
      });
    }

    function filter(field,val) {
      if(val.length >= 1) {
        grid.filters[field] =val; 
      } else {
        delete grid.filters[field] ;
      }
      grid.filtered = grid.data.filter(match);
      state.re=true;
    }

    function match(data) {
      var ok=true;

      for(var f in grid.filters) {
        if(typeof data[f] == 'undefined' || !(""+ data[f]).contains(grid.filters[f])) {
          ok=false;
        }
      }

      return ok;
    }

    function createTable() {
      grid.el = document.createElement("table");
      grid.el.setAttribute("class","x-supagrid");

      var head = document.createElement('thead');
      var head_line = document.createElement('tr');
      for(var i=0;i<grid.fields.length;i++) {
        var th = document.createElement('th');

        var span  = document.createElement('span');
        span.innerHTML = grid.fields[i];
        th.appendChild(span);

        var input = document.createElement('input');
        th.innerHTML=grid.fields[i];

        input.setAttribute("type","text");
        input.setAttribute("name",grid.fields[i]);
        input.addEventListener('change',function(e){
            var input = e.currentTarget;
            filter(input.getAttribute('name'),input.value);
        },false);

        th.appendChild(input);
        head_line.appendChild(th);
      }
      head.appendChild(head_line);
      grid.el.head = head;
      grid.el.head.line = head_line;
      grid.el.appendChild(head);

      var body = document.createElement("tbody");
      grid.el.body = body;
      grid.el.appendChild(body);

      if(typeof grid.parent != 'undefined') {
        grid.parent.appendChild(grid.el);
      }

      state.active=true;
    }

    return (function(options) {
      grid.data = options.data;
      grid.filtered = options.data;
      grid.parent = options.element;
      grid.state = state;

      if(typeof options.fields == 'undefined') {
        var fields =[];
        for(var i=0;i<data.length;i++) {
          for(var f in data[i]) {
            fields.push(f);
          }
        }
        grid.fields = fields.unique();
      } else {
        grid.fields = options.fields;
      }

      grid.options = options;

      createTable();

      update();
      requestAnimationFrame(render);
      state.updateInterval = setInterval(update,1000/30);
      bind();

      grid.focus = focus;

      return grid;
    })(options);

};

