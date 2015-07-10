
L.control.Table = L.Control.extend({

    options: {
        position: 'bottomleft',
        handler: {}
    },

    filters: {},
    filtered: false,

    createHeader: function() {
      var that = this;

      var tr   = L.DomUtil.create('tr','');

      for(var i=0;i<this.options.fields.length;i++) {
        var th    = L.DomUtil.create('th','');
        var span = L.DomUtil.create('span','');
        span.innerHTML = this.options.fields[i];
        th.appendChild(span);

        var input = L.DomUtil.create('input','leaflet-table-filter');
        input.setAttribute("type","text");
        input.setAttribute("name",this.options.fields[i]);
        input.addEventListener('change',function(e){
            var input = e.currentTarget;
            that.filter(input.getAttribute('name'),input.value);
        },false);

        th.appendChild(input);
        tr.appendChild(th);
      }
      this.table.querySelector("thead").appendChild(tr);
    },

    filter: function(field,val) {
      var that = this;

      var matches = this.table.querySelectorAll("tbody tr");
      for(var i=0;i<matches.length;i++) {
        matches[i].setAttribute('class','');
      }

      if(val.length >= 1) {
        this.filters[field] =val; 
      } else {
        delete this.filters[field] ;
      }

      var c=0;
      for(var f in this.filters) {
        c++;
        var matches = this.table.querySelectorAll("tbody input[name='"+f+"']:not([value*='"+this.filters[f]+"'])");
        for(var i=0;i<matches.length;i++) {
          matches[i].parentElement.parentElement.setAttribute('class','leaflet-table-not-match');
        }
      }

      /*
      if(c==0) {
        var matches = this.table.querySelectorAll("tbody tr");
        for(var i=0;i<matches.length;i++) {
          matches[i].setAttribute('class','leaflet-table-match');
        }
      }
      */
    },

    createBody: function() {
      for(var i=0;i<this.options.data.length;i++) {
        var tr = L.DomUtil.create('tr','leaflet-table-match');
        for(var f=0;f<this.options.fields.length;f++) {
          if(typeof this.options.data[i][ this.options.fields[f] ] == 'undefined') {
            this.options.data[i][ this.options.fields[f] ] = '';
          }
          var field = this.options.fields[f];
          var value = this.options.data[i][field];
          var id    = this.options.data[i][this.options.id];
          var input = this.createField(id,field,value);

          var td = L.DomUtil.create('td','');
          td.appendChild(input);
          tr.appendChild(td);
        }
        this.table.querySelector("tbody").appendChild(tr);
      }
    },

    createField: function(id,field,value) {
      var that = this;

      var input = L.DomUtil.create('input','');
      input.setAttribute("type","text");
      input.setAttribute("name",field);
      input.setAttribute("value",value);
      input.setAttribute("rel",id);

      if(typeof this.options.edit == 'undefined' || this.options.edit != true) {
        input.setAttribute("readonly","readonly");
      }

      input.addEventListener('keydown',function(e){
        var c=e.keyCode, k=e.key, input =e.target, prop=input.getAttribute('name');
        if(c == 13 || c == 40 || k == 'Enter' || k == 'Down')  {
          var nextTr=input.parentElement.parentElement.nextElementSibling;
          if(nextTr) {
            nextTr.querySelector("input[name="+prop+"]").focus();
          }
        } else if(c == 38 || k == 'Up') {
          var previousTr=input.parentElement.parentElement.previousElementSibling;
          if(previousTr) {
            previousTr.querySelector("input[name="+prop+"]").focus();
          }
        }
      },false);

      input.addEventListener('focus',function(e){
        var prevFocus = input.parentElement.parentElement.parentElement.querySelector("tr.leaflet-table-focus");
        if(prevFocus != null) prevFocus.setAttribute('class','');
        prevFocus = input.parentElement.parentElement.parentElement.querySelector("input.leaflet-table-focus");
        if(prevFocus != null) prevFocus.setAttribute('class','');
        input.parentElement.parentElement.setAttribute('class','leaflet-table-focus');
        input.setAttribute('class','leaflet-table-focus');

        that.onFocus(id);
      });

      return input;
    },

    focus: function(id) {
      this.table.querySelector("input[rel='"+id+"']").focus();
    },

    onFocus: function(id) {
      if(typeof this.options.onFocus == 'function') {
        var fn = this.options.onFocus;
        setTimeout(function() { fn(id) },250);
      }
    },

    onAdd: function(map) {
      var control = L.DomUtil.create('div','leaflet-control leaflet-control-table-container');
      var inner = L.DomUtil.create('div');

      var toggle  = L.DomUtil.create('button');
      toggle.innerHTML = "-";
      toggle.addEventListener('click',function(){
        if(toggle.innerHTML=='+') {
          inner.style.display='block';
          toggle.innerHTML = '-';
        } else {
          inner.style.display='none';
          toggle.innerHTML = '+';
        }
      },this);
      control.appendChild(toggle);
      control.appendChild(inner);

      var table = L.DomUtil.create('table','leaflet-control-table');
      this.table = table;

      table.onmousedown = table.ondblclick = L.DomEvent.stopPropagation;

      table.innerHTML='<thead></thead><tbody></tbody>';

      L.DomEvent.addListener(table, 'mouseover',function(){
        map.dragging.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
      },this);

      L.DomEvent.addListener(table, 'mouseout',function(){
        map.dragging.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
      },this);

      this.createHeader();
      this.createBody();

      inner.appendChild(table);
            
      return control;
    }
});

L.control.table = function (options) {
  return new L.control.Table(options);
};

L.control.geoJsonTable = function(overrides) {

  var options = {
    onFocus: function(id) {
      overrides.layer.eachLayer(function(l){
        if(l.feature.properties[overrides.id] == id) {
          l._map.setView(l.getLatLng(),14)
          /*
          l._map.panTo(l.getLatLng());
          l._map.setZoom(14);
          */
          l.openPopup();
        }
      });
    }
  };

  for(var k in overrides) {
    options[k] = overrides[k];
  };

  var table = new L.control.Table(options);

  overrides.layer.eachLayer(function(l){
    l.on('click',function(){
        table.focus(l.feature.properties[overrides.id]);
    });
  });

  return table;
};

