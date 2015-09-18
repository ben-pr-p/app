import template from './content-template.jade';
import View from '../view/view.js';
import urlBuilder from '../url-builder/url-builder';

export default class Workspace extends View {
  constructor(forum) {
    super(template, {
      forumUrl: urlBuilder.forum(forum)
    });
  }
}
