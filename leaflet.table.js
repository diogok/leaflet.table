
L.control.Table = L.Control.extend({

    options: {
        position: 'bottomleft',
        collapsed: true,
        edit: false,
        handler: {}
    },

    createHeader: function(def,thead) {
      var that = this;

      var tr   = L.DomUtil.create('tr','');

      for(var i=0;i<def.fields.length;i++) {
        var th    = L.DomUtil.create('th','');
        var span  = L.DomUtil.create('span','');
        span.innerHTML = def.fields[i];
        th.appendChild(span);

        var input = L.DomUtil.create('input','leaflet-table-filter');
        input.setAttribute("type","text");
        input.setAttribute("name",def.fields[i]);
        input.addEventListener('change',function(e){
            var input = e.currentTarget;
            that.filter(input.getAttribute('name'),input.value);
        },false);

        th.appendChild(input);
        tr.appendChild(th);
      }

      thead.appendChild(tr);
    },

    createBody: function(def,tbody) {
      var data = def.layer.getLayers().map(function(l){return l.properties;});
      for(var i=0;i<data.length;i++) {
        var tr = L.DomUtil.create('tr','leaflet-table-match');
        for(var f=0;f<def.fields.length;f++) {
          if(typeof data[i][ def.fields[f] ] == 'undefined') {
            data[i][def.fields[f]] = '';
          }
          var field = def.fields[f];
          var value = data[i][field];
          var id    = data[i][def.id];
          var input = this.createField(def,id,field,value);

          var td = L.DomUtil.create('td','');
          td.appendChild(input);
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
    },

    createField: function(def,id,field,value) {
      var that = this;

      var input = L.DomUtil.create('input','');
      input.setAttribute("type","text");
      input.setAttribute("name",field);
      input.setAttribute("value",value);
      input.setAttribute("rel",id);

      if(typeof def.edit == 'undefined' || def.edit != true) {
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

        that.onFocus(def,id);
      });

      return input;
    },

    focus: function(def,id) {
      this.expand();
      this.activate(def.tid);
      def.table.querySelector("input[rel='"+id+"']").focus();
    },

    onFocus: function(def,id) {
      def.layer.eachLayer(function(l){
        if(l.properties[def.id] == id) {
          if(l.getLatLng) {
            l._map.setView(l.getLatLng());
          } else if(l.getBounds) {
            l._map.setView(l.getBounds().getCenter());
          }
          l.openPopup();
        }
      });
    },

    filter: function(def,field,val) {
      var that = this;

      var matches = def.table.querySelectorAll("tbody tr");
      for(var i=0;i<matches.length;i++) {
        matches[i].setAttribute('class','');
      }

      if(val.length >= 1) {
        def.filters[field] =val; 
      } else {
        delete def.filters[field] ;
      }

      for(var f in def.filters) {
        var matches = def.table.querySelectorAll("tbody input[name='"+f+"']:not([value*='"+def.filters[f]+"'])");
        for(var i=0;i<matches.length;i++) {
          matches[i].parentElement.parentElement.setAttribute('class','leaflet-table-not-match');
        }
      }
    },

    dismiss: function() {
      this.inner.style.display='none';
      this.toggle.innerHTML = '+';
      this.options.collapsed=true;
    },

    expand: function() {
      this.inner.style.display='block';
      this.toggle.innerHTML = '-';
      this.options.collapsed=false;
    },

    addTable: function(def) {
      var that = this;

      var table = L.DomUtil.create('table','leaflet-control-table');
      table.setAttribute('rel',def.tid);
      table.style.display='none';
      def.table = table;

      table.onmousedown = table.ondblclick = L.DomEvent.stopPropagation;

      table.innerHTML='<thead></thead><tbody></tbody>';

      this.createHeader(def,table.querySelector('thead'));
      this.createBody(def,table.querySelector('tbody'));

      this.inner.appendChild(table);

      var option = L.DomUtil.create('option');
      option.value=def.tid;
      option.innerHTML=def.name;
      this.switcher.appendChild(option);

      if(def.tid == 0) setTimeout(function(){ that.activate(0); },1000);

      def.layer.eachLayer(function(l){
        l.on('click',function(){
          that.focus(def,l.properties[def.id]);
        });
      });
    },

    activate: function(tid0) {
      this.switcher.selectedIndex=tid0;
      var tables = this.control.querySelectorAll('table');
      for(var i=0;i<tables.length;i++) {
        var tid = tables[i].getAttribute('rel');
        if(tid==tid0) {
          tables[i].style.display='block';
        } else {
          tables[i].style.display='none';
        }
      }
    },

    onAdd: function(map) {
      var that = this;

      this._map=map;

      var control = L.DomUtil.create('div','leaflet-control leaflet-control-table-container');
      var inner = L.DomUtil.create('div');

      control.onmousedown = control.ondblclick = L.DomEvent.stopPropagation;

      var toggle  = L.DomUtil.create('button');
      toggle.innerHTML = "-";
      toggle.addEventListener('click',function(){
        if(that.options.collapsed) {
          that.expand();
        } else {
          that.dismiss();
        }
      },false);

      var switcher = L.DomUtil.create('select');
      switcher.addEventListener('change',function(e){
        that.activate( switcher.options[switcher.selectedIndex].value);
      },false);

      control.appendChild(toggle);
      control.appendChild(switcher);
      control.appendChild(inner);

      this.toggle=toggle;
      this.inner=inner;
      this.switcher=switcher;
      this.control=control;

      if(this.options.collapsed) {
        this.dismiss();
      }

      L.DomEvent.addListener(control, 'mouseover',function(){
        map.dragging.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
      },this);

      L.DomEvent.addListener(control, 'mouseout',function(){
        map.dragging.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
      },this);

      for(var t=0;t<this.options.tables.length;t++) {
        this.options.tables[t].tid = t;
        this.addTable(this.options.tables[t]);
      }

      return control;
    }
});

L.control.table = function (options) {
  return new L.control.Table(options);
};
