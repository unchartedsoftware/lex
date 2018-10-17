/** @jsx h */
import { h } from 'preact';
import { Lex, OptionState, OptionStateOption, TextEntryState, Action, ActionButton } from '../src/lex';
import '../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss';

// We can define a custom Action, with a callback (onAction) and
// the ability to suggest CSS classes to the containing token.
class PinAction extends Action {
  onAction () {
    super.onAction();
    this.value = !this.value;
  }
  suggestCssClass () {
    if (this.value) {
      return ['token-pinned'];
    } else {
      return [];
    }
  }
}
// This is the visual representation of our Action.
class PinActionButton extends ActionButton {
  render (_, {action}) { // eslint-disable-line no-unused-vars
    if (action.value === true) {
      return <button className='token-action' onMouseDown={this.onClick}>UNPIN</button>;
    } else {
      return <button className='token-action' onMouseDown={this.onClick}>PIN</button>;
    }
  }
}

// A simple language. Our Action will only appear on completed Tokens, and only
// if that Token is displaying the state which implies our Action.
const language = Lex
  .from('field', OptionState, {
    name: 'Choose a field to search',
    // This is our list of options we are providing to the user to select from
    // we can return a promise from this method as well to support network requests
    options: [
      new OptionStateOption('First Name'),
      new OptionStateOption('Last Name')
    ],
    icon: '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>',
    actions: [
      new PinAction({
        name: 'pin token',
        vkey: 'pinned'
      })
    ]
  })
  // Now that the user has selected an option from the available list, provide a
  // TextEntryState to allow the user to supply a value.
  .to('value', TextEntryState);
// Now that we have a language defined we can initialize our lex instance
const lex = new Lex({
  language: language,
  // Override the close icon that lex displays
  tokenXIcon: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
});

// Register our action and its visual representation
lex.registerActionButton(PinAction, PinActionButton);

// Render our search bar into our desired element
lex.render(document.getElementById('LexContainer'));

// Listen for relevant events
lex.on('token action', (...args) => console.log('token action', ...args));
