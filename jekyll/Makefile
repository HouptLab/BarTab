.DEFAULT_GOAL=help

-include Makefile.site

# Note: exclude ./help since some sites have non-phony help directory
source = $(MAKEFILE_LIST) \
  $(shell find . -not -path ./help -not -path '*/.svn/*' -not -path './_site*' -not -name .DS_Store | sed 's/ /\\ /g')

###########################################
.PHONY : bundle build run commit

bundle :
	bundle check > /dev/null || bundle install

## Build site
build : _site/index.html

_site/index.html : $(source) | bundle
	bundle exec jekyll build

## Run site for live development
run : | bundle
	bundle exec jekyll serve --livereload --open-url

## Test, diff and commit changes
commit : test-uptodate test-local test-clean
	@echo
	@echo 'Excellent! All local tests have passed. Press Return for diffs:'
	@read
	svn diff
	@echo
	@echo 'If the diffs look ok, press return for commit:'
	@read	
	SVN_EDITOR=$${SVN_EDITOR:-bbedit --wait --resume} svn commit

###########################################
.PHONY : test test-local doctor proof proof-external test-uptodate test-unversioned

## Test site

test : test-local proof-external

## Test site locally, excluding external link checks
test-local : doctor proof test-unversioned

doctor : | bundle
	bundle exec jekyll doctor

# --enforce-https --check-favicon --check-sri
proof : build
	bundle exec htmlproofer \
	--check-html --disable-external --check-img-http --check-opengraph \
	 --empty-alt-ignore --allow-hash-href $(PROOFERFLAGS) _site

proof-external : build
	bundle exec htmlproofer --external_only --check-external-hash _site

test-uptodate :
	@ ! F=$$(svn status --show-updates | grep '\*') \
	|| (echo "\nWarning: Working copy not up-to-date:\n$$F" >&2 ; exit 1)	

test-unversioned :
	@ ! F=$$(svn status | grep '^?') \
	|| (echo "\nWarning: Un-version files detected:\n$$F" >&2 ; exit 1)

test-clean : clean
	@ ! F=$$(svn status --no-ignore | grep -v '\.DS_Store' | grep '^?') \
	|| (echo "\nWarning: Un-cleaned files detected:\n$$F" >&2 ; exit 1)

###########################################
.PHONY : audit observatory lighthouse


tools = yq lighthouse

audit-tools :
	@ which $(tools) > /dev/null \
	|| (echo 'Missing tools, suggest: brew install $(tools)' >&2 ; exit 1)

url = $(shell yq eval '.url' _config.yml)
site = $(lastword $(subst ://, ,$(url)))

## Run audits on live site
audit : lighthouse observatory

observatory : | audit-tools
	#observatory --format report $(site)
	open https://observatory.mozilla.org/analyze/$(site)

lighthouse : | audit-tools
	cd /tmp/ && lighthouse --view --quiet --chrome-flags="--headless" $(url)

###########################################
.PHONY : clean help

## Clean all generated files
clean: | bundle
	bundle exec jekyll clean

## Display this help
help:
	@echo Makefile Targets:
	@awk -F ':|##' \
	'/^##/ {d=$$2}; /^[^#]/ {if (d) {printf "\033[36m%-20s\033[0m %s\n",$$1,d}; d=""}' \
	$(MAKEFILE_LIST)
