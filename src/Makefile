TARGET_NAMES = wahl-helfer
TARGET_DIRECTORY = ../html

SOURCE_DIRECTORY = .

TARGETS = $(TARGET_NAMES:%=$(TARGET_DIRECTORY)/%.js) $(TARGET_NAMES:%=$(TARGET_DIRECTORY)/%.min.js)

all: $(TARGETS)

clean:
	rm -f $(TARGETS)

$(TARGET_DIRECTORY)/%.min.js: $(TARGET_DIRECTORY)/%.js
	cat $< | uglifyjs --compress --mangle > $@

$(TARGET_DIRECTORY)/%.js: $(SOURCE_DIRECTORY)/%.coffee
	cat $< | coffee --compile --no-header --stdio > $@
