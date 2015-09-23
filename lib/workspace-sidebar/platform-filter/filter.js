// import ToggleParent from 'democracyos-toggle-parent';
import view from '../../view/mixin';
import template from './template.jade';
import platformFilter from '../../platform-filter/platform-filter';

export default class Filter extends view('appendable', 'removeable', 'withEvents') {
  constructor (options) {
    options.template = template;
    options.locals = options.filter;
    super(options);

    this.filter = this.options.filter;

    this.onNewPlatformClick = this.onNewPlatformClick.bind(this);

    this.switchOn();
  }

  switchOn () {
    this.bind('click', '[data-new-platform]', this.onNewPlatformClick);
    
  }

  // onNewPlatformClick (e) {
  //   log(e);
  //   log('Creating new platform');
  //   request
  //   .post('/api/platform/create')
  //   .end(function (err, res) {
  //     if (err || !res.ok) {
  //       log('Failed to create platform: error %s', err);
  //     }

  //     log('Successfully created platform %j', res.body);
  //   });
  // }
}
