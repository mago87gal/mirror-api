#!/usr/bin/python

# Copyright (C) 2013 Gerwin Sturm, FoldedSoft e.U.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Methods for Add a Cat to that service"""

__author__ = 'scarygami@gmail.com (Gerwin Sturm)'

import logging
import Image
import cStringIO
import re
import random

NUM_CATS = 6


def handle_image(item):
    """Callback for Timeline updates."""

    image = None
    if "attachments" in item:
        for att in item["attachments"]:
            if att["contentType"].startswith("image/"):
                image = att["contentUrl"]
                break

    if image is None:
        logging.info("No suitable attachment")
        return None

    if not image.startswith("data:image"):
        logging.info("Can only work with data-uri")
        return None

    img_data = re.search(r'base64,(.*)', image).group(1)
    tempimg = cStringIO.StringIO(img_data.decode('base64'))
    im = Image.open(tempimg)

    cat = random.randint(1, NUM_CATS)
    cat_image = Image.open("res/cat%s.png" % cat)

    im.paste(cat_image, (0, 0), cat_image)

    f = cStringIO.StringIO()
    im.save(f, "JPEG")
    content = f.getvalue()
    f.close()
    data_uri = "data:image/jpeg;base64," + content.encode("base64").replace("\n", "")

    new_item = {}
    new_item["attachments"] = [{"contentType": "image/jpeg", "contentUrl": data_uri}]
    new_item["menuItems"] = [{"action": "SHARE"}]

    return new_item
