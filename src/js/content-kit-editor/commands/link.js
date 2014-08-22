import TextFormatCommand from './text-format';
import Prompt from '../views/prompt';
import { Tags, RegEx } from '../constants';
import { inherit } from '../../content-kit-utils/object-utils';
import { getSelectionTagName } from '../utils/selection-utils';

function LinkCommand() {
  TextFormatCommand.call(this, {
    name: 'link',
    tag: Tags.LINK,
    action: 'createLink',
    removeAction: 'unlink',
    button: '<i class="ck-icon-link"></i>',
    prompt: new Prompt({
      command: this,
      placeholder: 'Enter a url, press return...'
    })
  });
}
inherit(LinkCommand, TextFormatCommand);

LinkCommand.prototype.exec = function(url) {
  if(this.tag === getSelectionTagName()) {
    this.unexec();
  } else {
    if (!RegEx.HTTP_PROTOCOL.test(url)) {
      url = 'http://' + url;
    }
    LinkCommand._super.prototype.exec.call(this, url);
  }
};

export default LinkCommand;