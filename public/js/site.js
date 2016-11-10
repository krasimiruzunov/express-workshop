$(function () {
  $('a.delete').on('click', function (e) {
    e.preventDefault()
    let self = $(this)
    $('#confirm').modal('show')
    $('#confirm #delete').off('click').on('click', function (e) {
      e.preventDefault()
      let parent = self.parent()
      console.log(parent)
      if (parent.hasClass('actions')) {
        $('#confirm').modal('hide')
        window.top.location.href = self.attr('href')
      } else {
        $.ajax({
          url: self.attr('href'),
          type: 'DELETE',
          success: function (result) {
            if (result.success) {
              $('#confirm').modal('hide')
              parent.remove()
            }
          }
        })
      }
    })
  })

  $("select[multiple] option").mousedown(function () {
    if ($(this).prop('selected')) {
      $(this).prop("selected", false)
    } else {
      $(this).prop('selected', true)
    }
    return false
  })

  $('select#limit').on('change', function () {
    let models = $(this).attr('models').split(' ')
    console.log(models)
    let limit = $(this).val()
    $.ajax({
      url: `/${models.join('/')}/limit`,
      type: 'POST',
      data: {
        limit: limit
      },
      success: function (result) {
        if (result.success) {
          window.top.location.href = `/${models.join('/')}`
        }
      }
    })
  })

  $('.header p').off('click').on('click', function (e) {
    e.preventDefault()
    let model = $(this).parent().attr('class').split(' ')[0]
    let field = $(this).attr('id')
    let direction = $(this).attr('class') || 'asc'
    if (direction === 'asc') {
      direction = 'desc'
    } else {
      direction = 'asc'
    }

    $.ajax({
      url: `/${model}/sort`,
      type: 'POST',
      data: {
        field: field,
        direction: direction
      },
      success: function (result) {
        if (result.success) {
          window.top.location.href = `/${model}`
        }
      }
    })
  })

  $('.votes a').off('click').on('click', function (e) {
    e.preventDefault()
    let self = $(this)
    $.ajax({
      url: self.attr('href'),
      type: 'POST',
      success: function (result) {
        if (result.success) {
          self.parent().find('.totalVotes').text(result.totalVotes)
        }
      }
    })
  })

  $('.add-comment').off('click').on('click', function (e) {
    e.preventDefault()
    $(this).hide()
    $(this).next().css('margin-left', '50px').show()
  })

  $('.comment-form').on('submit', function (e) {
    e.preventDefault()
    let self = $(this)
    let comment = self.find('#comment')
    $.ajax({
      url: self.attr('action'),
      type: 'POST',
      data: {
        comment: comment.val()
      },
      success: function (result) {
        if (result.success) {
          self.prev().prev().append(`<span class='comment'>${result.comment} - ${result.createdBy} ${result.date}</sapn>`)
          comment.val('')
          self.hide()
          $('.add-comment').show()
        } else {
          $('.error').remove()
          self.append(`<div class="error"><p>${result.errors.join('</p><p>')}</p></div>`)
        }
      }
    })
  })

  let answerErrors = $('.answer-errors')
  if (answerErrors.length) {
    $('html, body').animate({
      scrollTop: answerErrors.offset().top
    }, 2000)
  }
})
