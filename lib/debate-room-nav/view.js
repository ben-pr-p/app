import dom from 'component-dom';
import page from 'page';
import t from 't-component';
import view from '../view/mixin';
import template from './template.jade';
import bus from 'bus';

class DebateRoomNav extends view('appendable', 'withEvents') {
  constructor (options = {}) {
    options.template = template;
    options.container = document.querySelector('section.app-content');
    super(options);

    ['show', 'hide', 'setForum', 'setType', 'setItem', 'select', 'onclick'].forEach(m => {
      this[m] = this[m].bind(this);
    });
  }

  switchOn () {
    this.bind('click', '.nav-button', this.onclick);
  }

  onclick (e) {
    e.preventDefault();

    if (dom(e.delegateTarget).hasClass('active')) return;

    let prefix = this.forum ? this.forum.url.slice(0, this.forum.url.length - 1) : '';

    if (dom(e.delegateTarget).hasClass('debate-button')) {
      prefix += '/debateroom';
      this.select('debate');
    } else {
      this.select('vote');
    }

    page(prefix + `/${this.type}/${this.item.id}`);
  }

  show () {
    dom(this.el).removeClass('hide');
  }

  hide () {
    dom(this.el).addClass('hide');
    bus.emit('debate:stop');
  }

  setForum (forum = null) {
    this.forum = forum;
  }

  setType (type = null) {
    this.type = type;
  }

  setItem (item = null) {
    this.item = item;
  }

  select (one) {
    this.show();
    dom('.nav-button').removeClass('active');
    dom(this.el).find(`.${one}-button`).addClass('active');

    if (one != 'debate') {
      bus.emit('debate:stop');
    }
  }
}

export default new DebateRoomNav();

