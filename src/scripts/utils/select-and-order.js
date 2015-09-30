function SearchAndOrder(node, list, options) {
    function forEach(list, callback) {
        function isNodeList(nodes) {
            var stringRepr = Object.prototype.toString.call(nodes);

            return typeof nodes === 'object' &&
                /^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr);
        }

        if (Object.prototype.toString.call(list) === '[object Array]') {
            for (var i = 0; !!list && i < list.length; i++) {
                callback(list[i], i);
            }
        }
        else if (typeof list == 'object') {
            var isNodeList = isNodeList(list);

            for (var i in list) {
                if (!isNodeList || (isNodeList && i != 'length' && i != 'item')) {
                    callback(list[i], i);
                }
            }
        }
    }
    function indexOfItem(list, item){
        for(var i = 0; !!list && i < list.length; i++){
            if(!!item && typeof item === 'string' && !!list[i] && typeof list[i] === 'string' && item == list[i]){
                return i;
            }
            else if(!!item && typeof item === 'object' && !!list[i] && typeof list[i] === 'object' ){
                if(!!item.name && !!item.value && list[i].name == item.name && list[i].value == item.value){
                    return i;
                }
            }
        }
        return -1;
    }

    function FilterMultiSelect(node, list, options) {
        // Privates
        var model = [];             // This is essentially a straight copy of the list
        var filteredModel = [];     // This contains the list items, but also the index it maps to in the original model. E.g. [{index: 2, item: 'An item'}, {index: 3, item: {name: 'A name', value: 'value pair'}}]
        var selectedIndices = [];
        var instance = this;
        // Utilities


        // Start - Model related functions
        function createModel() {
            model = list;
        }

        function createFilteredModel(filter) {
            filteredModel = [];

            for (var i = 0; !!model && i < model.length; i++) {
                var item = model[i];
                var value = (typeof item === 'string') ? item : item.name;
                if (!filter || value.toLowerCase().indexOf(filter.toLowerCase()) != -1) {    // Then we want it in our filtered list
                    filteredModel[filteredModel.length] = {index: i, item: item};
                }
            }
        }

        function filterModel(filter) {
            createFilteredModel(filter);    // Create the new filetered model
            removeCheckboxHandlers();       // Remove existing event handlers on checkboxes
            createListElements();           // Then re-create the html list
            createCheckboxHandlers();       // Create new event handlers on checkboxes

            return filteredModel;
        }

        function getFlattenedModel() {
            var flattenedModel = {};
            forEach(model, function forEachModelItem(item, propertyName) {
                if (typeof item === 'object') {
                    if (!!item.value) {
                        flattenedModel[propertyName] = item.value;
                    }
                }
                else if (typeof item === 'string') {
                    flattenedModel[propertyName] = item;
                }
            });

            return flattenedModel;
        }

        function getFlattenedSelectedModel() {
            // Build selected model from selected indices;
            var selectedModel = [];
            selectedIndices.sort(function compareNumbers(a, b) {
                return a - b;
            });
            var flattenedModel = getFlattenedModel();
            for (var i = 0; !!selectedIndices && i < selectedIndices.length; i++) {
                selectedModel[selectedModel.length] = flattenedModel[selectedIndices[i]];
            }

            return selectedModel;
        }

        function getModel() {
            return model;
        }

        function setModel(deltaModel) {
            model = deltaModel;
            createFilteredModel();
            createListElements();           // Then re-create the html list
            createCheckboxHandlers();       // Create new event handlers on checkboxes
        }

        function getSelectedModel() {
            // Build selected model from selected indices;
            var selectedModel = [];
            selectedIndices.sort(function compareNumbers(a, b) {
                return a - b;
            });
            for (var i = 0; !!selectedIndices && i < selectedIndices.length; i++) {
                selectedModel[selectedModel.length] = model[selectedIndices[i]];
            }

            return selectedModel;
        }

        function setSelectedModel(deltaSelectedModel) {
            // Clear current selections
            var checkboxes = node.querySelectorAll('.multiSelect input');
            forEach(checkboxes, function forEachCheckbox(checkbox) {
                checkbox.checked = false;
            });
            // Clear selected indices
            selectedIndices = [];

            // Make new selection (on checkboxes
            forEach(deltaSelectedModel, function forEachModelItem(value) {
                forEach(checkboxes, function forEachCheckbox(checkbox, index) {
                    if (checkbox.value == value) {
                        checkbox.checked = true;
                    }
                });
            });

            // Update selected indices
            var model = getFlattenedModel();
            forEach(deltaSelectedModel, function forEachModelItem(value) {
                forEach(model, function forEachItem(item, index) {
                    if (item == value) {
                        selectedIndices[selectedIndices.length] = Number(index);
                    }
                });
            });
        }

        // End - Model related functions
        // Start - View related functions
        function createElements() {
            if (!node) {
                console.error('No node found, cannot create widget.')
                return;
            }
            if (!model) {
                console.error('No model created yet (i.e. model variable is null). A model is required for the list to be created.');
                return;
            }

            // Create the elements
            var html = '';

            html += '<div class="multiSelectContainer"><div class="filterBlock"><span class="filterLabel">filter:</span><input class="filterInput" type="text"/></div>'
            html += '<ul class="multiSelect">';

            html += '</ul>';
            if (node.parentNode.className.indexOf('control') == -1 || node.parentNode.parentNode.className.indexOf('multi_select_wrapper') == -1) {
                html += '</div></div>';
            }
            node.innerHTML = html;

            // Create the list items
            createListElements();
        }

        function createListElements() {
            function createListItemHTML(display, value, index) {
                var isChecked = (selectedIndices.indexOf(index) != -1)

                return '<li><label><input data-index="' + index + '" type="checkbox" value="' + value + '" ' + (isChecked ? 'checked' : '') + '/><span class="optionText">' + display + '</span></label></li>';
            }

            var listHtml = '';
            for (var i = 0; !!filteredModel && i < filteredModel.length; i++) {
                // Use the filteredModel, even when not filtered, as filteredModel will be populated by model in this case
                var item = filteredModel[i].item;
                var name = (typeof item === 'string') ? item : item.name;
                var value = (typeof item === 'string') ? item : item.value;
                listHtml += createListItemHTML(name, value, filteredModel[i].index);
            }
            var unorderedList = node.querySelector('ul');
            unorderedList.innerHTML = listHtml;
        }

        // End - View related functions
        // Start - Event handlers
        function addToSelectedIndices(index) {
            if (isNaN(index)) {
                console.error('Cannot add index: ' + index + ' to selectedIndices. It needs to be a number.')
                return;
            }
            selectedIndices.push(index);
        }

        function removeFromSelectedIndices(index) {
            if (isNaN(index)) {
                console.error('Cannot remove index: ' + index + ' to selectedIndices. It needs to be a number.')
                return;
            }
            var indexOfItem = selectedIndices.indexOf(index);
            selectedIndices.splice(indexOfItem, 1);
        }

        function onCheckboxChange() {
            if (this.checked) {
                addToSelectedIndices(Number(this.getAttribute('data-index')));
            }
            else {
                removeFromSelectedIndices(Number(this.getAttribute('data-index')));
            }

            // Fire callback for checkbox change if provided in options
            !!options && !!options.setOnCheckboxChange && options.setOnCheckboxChange.bind(instance)(this);
        }

        function createFilterEventHandler() {
            var filterInput = node.querySelector('.filterInput');
            filterInput.addEventListener('keyup', function onKeyUp(event) {
                filterModel(this.value);
            });
        }

        function createCheckboxHandlers() {
            var checkboxes = node.querySelectorAll('input[type=checkbox]');

            for (var i = 0; !!checkboxes && i < checkboxes.length; i++) {
                checkboxes[i].addEventListener('change', onCheckboxChange);
            }
        }

        function removeCheckboxHandlers() {
            var checkboxes = node.querySelectorAll('input[type=checkbox]');

            for (var i = 0; !!checkboxes && i < checkboxes.length; i++) {
                checkboxes[i].removeEventListener('change', onCheckboxChange);
            }
        }

        function createHandlers() {
            if (!node) {
                console.error('No node found, cannot create widget.')
                return;
            }
            createCheckboxHandlers();

            // Create handler for filter input
            createFilterEventHandler();
        }

        // End - Event handlers

        // Code to run things
        createModel();
        createFilteredModel();
        createElements();
        createHandlers();
        // Public functions
        this.id = (!!options && options.id);
        this.label = (!!options && options.label);
        this.getModel = getModel;
        this.getFlattenedModel = getFlattenedModel;
        this.setModel = setModel;
        this.filterModel = filterModel;
        this.getSelectedModel = getSelectedModel;
        this.getFlattenedSelectedModel = getFlattenedSelectedModel;
        this.setSelectedModel = setSelectedModel;
        this.setOnCheckboxChange = function (callback) {
            options.onCheckboxChange = callback;
        }
    }
    function flattenList(list){
        var returnList = []
        forEach(list, function forEachListItem(listItem){
            if(typeof listItem === 'string'){
                returnList.push(listItem);
            }
            else if(!!listItem.name && !!listItem.value){
                returnList.push(listItem.value);
            }
        });

        return returnList;
    }
    function createOrderList(node, list){
        var ul = node;
        ul.innerHTML = '';
        forEach(list, function forEachListItem(item, index){
            var nvp = {name: '', value: ''};
            if(typeof item === 'string'){
                nvp.name = item;
                nvp.value = item;
            }
            else{
                nvp.name = item.name;
                nvp.value = item.value;
            }
            var li = document.createElement('li');
            // Create the text
            var span = document.createElement('span');
            span.className = "text";
            span.innerText = nvp.name;
            li.appendChild(span);
            // Create the remove button
            var span = document.createElement('span');
            span.className = "removeLink";
            span.innerText = 'x';
            span.onclick = function(){
                selectedItems.splice(index, 1);
                createOrderList(node, selectedItems);
                !!selectListWidget && selectListWidget.setSelectedModel(flattenList(selectedItems));
            }
            li.appendChild(span);
            li.setAttribute('data-value', nvp.value);
            li.setAttribute('data-index', index);
            li.setAttribute('data-type', (typeof item === 'string' ? 'string' : 'nvp'));

            // Append the list item
            ul.appendChild(li);
        });
    }
    // Actual code
    node.className += ' selectAndOrder';
    // Create two child nodes, one for the select list, one for the order list
    var selectNode = document.createElement('div');
    node.appendChild(selectNode);
    var orderNodeContainer = document.createElement('div');
    var orderNode = document.createElement('ul');
    orderNode.className = 'dndSorter';
    orderNodeContainer.appendChild(orderNode);
    node.appendChild(orderNodeContainer);

    var selectedItems = []
    options.setOnCheckboxChange = function (checkedNode) {
        var index = Number(!!checkedNode && checkedNode.getAttribute('data-index'));
        var changedItem = this.getModel()[index];
        if(checkedNode.checked){
            if(selectedItems.length == 0){
                selectedItems = this.getFlattenedSelectedModel();
            }
            else{
                if(indexOfItem(selectedItems,changedItem) == -1){  // If list already exists, we don't want to disrupt the order, push to top
                    selectedItems.push(this.getModel()[index]);
                }
            }
        }
        else if(!checkedNode.checked){
            var changedIndex = indexOfItem(selectedItems,changedItem);
            selectedItems.splice(changedIndex, 1)
        }
        createOrderList(orderNode, selectedItems);
        console.log('Checkbox change: ' + JSON.stringify(selectedItems));
    }
    var selectListWidget = new FilterMultiSelect(selectNode, list, options);

    var dndWidget = dragula([orderNode], {
        isContainer: function (el) {
            return false; // only elements in drake.containers will be taken into account
        },
        moves: function (el, source, handle, sibling) {
            return true; // elements are always draggable by default
        },
        accepts: function (el, target, source, sibling) {
            return true; // elements can be dropped in any of the `containers` by default
        },
        invalid: function (el, target) { // don't prevent any drags from initiating by default
            return false;
        },
        direction: 'vertical',         // Y axis is considered when determining where an element would be dropped
        copy: false,                   // elements are moved by default, not copied
        revertOnSpill: false,          // spilling will put the element back where it was dragged from, if this is true
        removeOnSpill: false,          // spilling will `.remove` the element, if this is true
        mirrorContainer: document.body // set the element that gets mirror elements appended
    });
    dndWidget.on('drop', function(){
        var listItems = document.querySelectorAll('ul.dndSorter li');
        selectedItems = [];
        forEach(listItems, function forEachListItem(listItem, index){
            var selectedItem;
            if(listItem.getAttribute('data-type') == 'nvp'){
                selectedItem = {name: '', value: ''};
                selectedItem.name = listItem.innerText;
                selectedItem.value = listItem.getAttribute('data-value');
            }
            else{
                selectedItem = listItem.innerText;
            }
            selectedItems.push(selectedItem);
            listItem.setAttribute('data-index', index);
        });
    });
}

