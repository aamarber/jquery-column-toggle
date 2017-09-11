(function($) {

    $.fn.columntoggle = function( options ) {



        // Establish our default settings
        var settings = $.extend({
            //Class of column toggle contains toggle link
            toggleContainerClass: 'columntoggle-container',

            //Text in column toggle box
            toggleLabel: 'Show/Hide columns: ',

            //the prefix of key in localstorage
            keyPrefix: 'columntoggle-',

            //keyname in localstorage, if empty, it will get from URL
            key: '',

            // The text to show when no column is selected
            nonSelectedText: 'Select...',

            // The text to show when every column is selected
            allSelectedText: 'Every column selected',

            // The text to show when every column is shown
            selectAllText: 'Select all columns',

        }, options);

        //set default key for storage
        if (settings.key.length == 0) {
            settings.key = window.location.href;
        }

        var toggleStatusStorage = {
            save: function(el){
              if(!toggleViewModel.isLoaded){
                return;
              }

                var hidelist = [];
                $(el).find('thead > tr > th').each(function(index){
                    //column index start from 1
                    var columnindex = index + 1;

                    if ($(this).is(':visible') === false) {
                        hidelist.push(columnindex + '');
                    }
                });

                localStorage.setItem(settings.keyPrefix + settings.key, hidelist.join(','));
            },
            load: function(el){
                if (settings.key.length > 0) {
                    var hidelistString = localStorage.getItem(settings.keyPrefix + settings.key);
                    if (hidelistString !== null && hidelistString.length > 0) {
                        var hidelist = hidelistString.split(',');
                        if (hidelist.length > 0) {
                            $.each(hidelist, function(index, columnindex){
                                $(el).find('td:nth-child('+columnindex+'), th:nth-child('+columnindex+')').hide();
                            });

                            $('[data-select-type="columnToggler"]').multiselect('deselect', hidelist);
                        }

                    }
                }
            }
        };

        var toggleViewModel = {
          isLoaded: false,
          initMultiselect: function(table, multiselectsSelector, selectorColumnValues){
            var onChange = function(option, checked, select) {
              var columnindex = $(option).attr('data-columnindex');
              toggleViewModel.toggleColumn(table, columnindex, checked);
              toggleStatusStorage.save(table);
            }

            var $multiSelects = $(multiselectsSelector);

            $multiSelects.multiselect({
              buttonClass: 'btn btn-default btn-sm',
              nonSelectedText: settings.nonSelectedText,
              allSelectedText: settings.allSelectedText,
              includeSelectAllOption: true,
              selectAllText: settings.selectAllText,
              onChange: onChange,
              onDeselectAll: function(){
                toggleViewModel.toggleAllColumns(table, selectorColumnValues, false);
              },
              onSelectAll: function(){
                toggleViewModel.toggleAllColumns(table, selectorColumnValues, true);
              },
            });
            $multiSelects.multiselect('select', selectorColumnValues);
            toggleViewModel.isLoaded = true;
          },

          toggleColumn(table, columnIndex, selected){
            var $columns = $(table).find('td:nth-child('+columnIndex+'), th:nth-child('+columnIndex+')');

            if(selected){
              $columns.show();
            }
            else{
              $columns.hide();
            }
          },

          toggleAllColumns: function(table, columns, selected){
            columns.forEach(function(columnValue){
              toggleViewModel.toggleColumn(table, columnValue, selected);
            });
            toggleStatusStorage.save(table);
          }
        };

        return this.each( function() {

            //Detect to prevent add more togglebox to a table (ussally from react didUpdate)
            if ($(this).next().hasClass(settings.toggleContainerClass)) {
                $(this).next().remove();
            }

            var table = $(this);

            //find table header to extract columns
            var toggleColumnOptionsSelector = [], selectorColumnValues = [];
            $(this).find('thead > tr > th').each(function(index){

                //column index start from 1
                var columnindex = index + 1;

                var togglenameAttr = $(this).attr('data-columntoggle');
                var toggleName = '';
                if (typeof togglenameAttr !== typeof undefined && togglenameAttr !== false) {
                    toggleName = togglenameAttr;
                } else {
                    toggleName = $(this).text();
                }

                var columnSelector = `<option value="${columnindex}" data-columnindex="${columnindex}">${toggleName}</option>`;
                selectorColumnValues.push(columnindex);
                toggleColumnOptionsSelector.push(columnSelector);
            });

            var toggleColumnSelector = `<select id="columnToggler" data-select-type="columnToggler" multiple="multiple" class="multiselect ${settings.toggleContainerClass}">${toggleColumnOptionsSelector.join('')}</select>`;

            var toggleContainer = `<div class="${settings.toggleContainerClass}">${settings.toggleLabel} ${toggleColumnSelector}</div>`;

            $(this).before(toggleContainer);

            toggleViewModel.initMultiselect(table, '[data-select-type="columnToggler"]', selectorColumnValues);

            //load hide status from cache
            toggleStatusStorage.load(table);
        });


    }
}(jQuery));
