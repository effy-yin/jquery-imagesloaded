(function(window, $) {
	function ImagesLoaded(ele, options, onAlways) {

		this.elements = $(ele);
		this.options  = $.extend({}, this.options);


        if ( typeof options === 'function' ) {
            onAlways = options;
        } else {
            $.extend( this.options, options );
        }

        if ( onAlways ) {
            this.on( 'always', onAlways );/////
        }

        this.getImages();

        this.jqDeferred = new $.Deferred();


      // HACK check async to allow time to bind listeners
        var _this = this;
        setTimeout( function() {
            _this.check();/////////////////
        });
	}
    ImagesLoaded.prototype = {
        options: {},
        images: [],
        hasAnyBroken: false,
        isComplete: false,
        getImages: function() {

            this.images = [];/////////////////////

            // filter & find items if we have an item selector
            for ( var i=0, len = this.elements.length; i < len; i++ ) {
                var elem = this.elements[i];
                // filter siblings
                if ( elem.nodeName === 'IMG' ) {
                    this.addImage( elem );
                }
                // find children
                // no non-element nodes, #143
                var nodeType = elem.nodeType;
                if ( !nodeType || !( nodeType === 1 || nodeType === 9 || nodeType === 11 ) ) {
                    continue;
                }
                var childElems = elem.querySelectorAll('img');
                // concat childElems to filterFound array
                for ( var j=0, jLen = childElems.length; j < jLen; j++ ) {
                    var img = childElems[j];
                    this.addImage( img );
                }
            }
        },
        addImage: function(img) {
            var loadingImage = new LoadingImage( img );
            this.images.push( loadingImage );
        },
        check: function() {
            var _this = this;
            var checkedCount = 0;
            var length = this.images.length;
            this.hasAnyBroken = false;
            // complete if no images
            if ( !length ) {
                this.complete();
                return;
            }

            function onConfirm( image, message ) {
                var hasConsole = typeof console !== 'undefined';
                if ( _this.options.debug && hasConsole ) {
                    console.log( 'confirm', image, message );////
                }

                _this.progress( image );
                checkedCount++;
                if ( checkedCount === length ) {
                    _this.complete();
                }
                return true; // bind once//////////////////
            }

            for ( var i=0; i < length; i++ ) {
                var loadingImage = this.images[i];
                loadingImage.on( 'confirm', onConfirm );
                loadingImage.check();
            }
        },
        progress: function(image) {
            this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
            // HACK - Chrome triggers event before object properties have changed. #83
            var _this = this;
            setTimeout( function() {
                 _this.trigger( 'progress', image );//////
                if ( _this.jqDeferred.notify ) {
                    _this.jqDeferred.notify( _this, image );
                }
            });
        },
        complete: function() {
            var eventName = this.hasAnyBroken ? 'fail' : 'done';
            this.isComplete = true;
            var _this = this;
            // HACK - another setTimeout so that confirm happens after progress
            setTimeout( function() {
                _this.trigger( eventName );
                _this.trigger( 'always' );
               
                var jqMethod = _this.hasAnyBroken ? 'reject' : 'resolve';
                _this.jqDeferred[ jqMethod ]( _this );
            
            });
        }
    };

	$.fn.imagesloaded = function(options, callback) {
        var instance = new ImagesLoaded( this, options, callback );
        return instance.jqDeferred.promise( $(this) );
	};
      

    function LoadingImage(img) {
        this.img = img;
    }

    LoadingImage.prototype = {
        isLoaded: false,
        check: function() {
            // first check cached any previous images that have same src
            var resource = cache[ this.img.src ] || new Resource( this.img.src );
            if ( resource.isConfirmed ) {
                this.confirm( resource.isLoaded, 'cached was confirmed' );
                return;
            }

            // If complete is true and browser supports natural sizes,
            // try to check for image status manually.
            if ( this.img.complete && this.img.naturalWidth !== undefined ) {
              // report based on naturalWidth
                this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
                return;
            }

            // If none of the checks above matched, simulate loading on detached element.
            var _this = this;
            resource.on( 'confirm', function( resrc, message ) {
                _this.confirm( resrc.isLoaded, message );
                return true;
            });

            resource.check();
        },
        confirm: function() {
            this.isLoaded = isLoaded;
            this.trigger( 'confirm', message );
        }
    };
      
    // -------------------------- Resource -------------------------- //

  // Resource checks each src, only once
  // separate class from LoadingImage to prevent memory leaks. See #115

  var cache = {};

  function Resource( src ) {
    this.src = src;
    // add to cache
    cache[ src ] = this;
  }

    Resource.prototype = {
        src: '',
        isChecked: false,
        isLoaded: false,
        isConfirmed: false,
        check: function() {
            // only trigger checking once
            if ( this.isChecked ) {
              return;
            }
            // simulate loading on detached element
            var proxyImage = new Image();
            proxyImage.on('load', this.onload);
            proxyImage.on('load', this.onerror);
            proxyImage.src = this.src;
            // set flag
            this.isChecked = true;
        }, 
        onload: function( event ) {
            this.confirm( true, 'onload' );
            this.unbind('load', onload);
            this.unbind('error', onerror);
        },
        onerror: function( event ) {
            this.confirm( false, 'onerror' );
            this.unbind('load', onload);
            this.unbind('error', onerror);
        },
        confirm: function( isLoaded, message ) {
            this.isConfirmed = true;
            this.isLoaded = isLoaded;
            this.trigger( 'confirm', message );
        }
    };


})(window, jQuery)