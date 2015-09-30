// Test area
window.ms = new SearchAndOrder(document.querySelector('.holder'), ['dog', 'cat', {name: 'bunny', value: 'b'}, 'parrot', {name: 'donkey', value: 'd'}, 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'], {id: 'team', label: 'Team'});


dragula([document.querySelector('.dndContainer')], {
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