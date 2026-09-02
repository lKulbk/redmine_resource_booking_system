class RrbsIssueFormHook < Redmine::Hook::ViewListener
  render_on :view_issues_form_details_bottom,
            partial: 'rrbs_hooks/issue_form_departments'
end
