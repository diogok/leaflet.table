
L.control.Table = L.Control.extend({

    options: {
        position: 'bottomleft',
        collapsed: true,
        edit: false,
        handler: {}
    },

    focus: function(def,id) {
      this.expand();
      this.activate(def.tid);

      for(var t=0;t<this.options.tables.length;t++) {
        if(this.options.tables[t].tid == def.tid) {
          this.options.tables[t].grid.focus(id);
        }
      }
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

    dismiss: function() {
      this.inner.style.display='none';
      this.toggle.innerHTML = '+';
      this.options.collapsed=true;
    },

    expand: function() {
      this.inner.style.display='block';
      this.toggle.innerHTML = '-';
      this.options.collapsed=false;

      var tid= this.switcher.options[this.switcher.selectedIndex].value;
      for(var t=0;t<this.options.tables.length;t++) {
        if(this.options.tables[t].tid == tid) {
          this.options.tables[t].grid.state.re=true;
        }
      }
    },

    addTable: function(def) {
      var that = this;

      var grid = supagrid({
        fields: def.fields,
        id: def.id,
        edit: this.options.edit,
        data: def.layer.getLayers().map(function(l) {return l.properties;}),
        onFocus: function(id) {
          that.onFocus(def,id);
        }
      });
      def.grid=grid;

      var table = grid.container;
      table.setAttribute('rel',def.tid);
      table.style.display='none';
      def.table = table;

      table.onmousedown = table.ondblclick = L.DomEvent.stopPropagation;

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

      for(var t=0;t<this.options.tables.length;t++) {
        if(this.options.tables[t].tid == tid0) {
          this.options.tables[t].table.style.display='block';
          this.options.tables[t].grid.state.re=true;
        } else {
          this.options.tables[t].table.style.display='none';
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

      var that=this;
      setTimeout(function(){
        if(that.options.collapsed) {
          that.dismiss();
        } else {
          that.expand();
        }
      },2000);

      return control;
    }
});

L.control.table = function (options) {
  return new L.control.Table(options);
};
