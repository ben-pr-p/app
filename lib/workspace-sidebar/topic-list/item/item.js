import view from '../../../view/mixin';
import { domRender } from '../../../render/render';
import template from './template.jade';

export default class List extends view('appendable') {
  constructor (options = {}, topic) {
    options.template = template;
    options.locals = {item: topic};
    super(options);

    this.topic = topic;
  }

  switchOn () {
    
  }
}
