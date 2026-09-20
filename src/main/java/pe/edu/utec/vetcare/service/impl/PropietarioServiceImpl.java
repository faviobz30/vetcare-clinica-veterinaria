package pe.edu.utec.vetcare.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utec.vetcare.dto.request.PropietarioRequest;
import pe.edu.utec.vetcare.dto.response.PropietarioResponse;
import pe.edu.utec.vetcare.entity.PropietarioEntity;
import pe.edu.utec.vetcare.entity.UsuarioEntity;
import pe.edu.utec.vetcare.exception.BadRequestException;
import pe.edu.utec.vetcare.exception.ResourceNotFoundException;
import pe.edu.utec.vetcare.mapper.PropietarioMapper;
import pe.edu.utec.vetcare.repository.PropietarioRepository;
import pe.edu.utec.vetcare.repository.UsuarioRepository;
import pe.edu.utec.vetcare.service.PropietarioService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PropietarioServiceImpl
        implements PropietarioService {

    private final PropietarioRepository propietarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final PropietarioMapper propietarioMapper;

    @Override
    @Transactional(readOnly = true)
    public List<PropietarioResponse> listar() {

        return propietarioRepository.findAll()
                .stream()
                .map(propietarioMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PropietarioResponse obtener(Long id) {

        return propietarioMapper.toResponse(
                buscarPropietario(id)
        );
    }

    @Override
    @Transactional
    public PropietarioResponse crear(
            PropietarioRequest request
    ) {

        if (propietarioRepository
                .existsByUsuarioIdUsuario(
                        request.getIdUsuario()
                )) {

            throw new BadRequestException(
                    "El usuario ya tiene un propietario asociado"
            );
        }

        UsuarioEntity usuario =
                usuarioRepository
                        .findById(request.getIdUsuario())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Usuario no encontrado"
                                )
                        );

        PropietarioEntity entity =
                propietarioMapper.toEntity(request);

        entity.setUsuario(usuario);

        return propietarioMapper.toResponse(
                propietarioRepository.save(entity)
        );
    }

    @Override
    @Transactional
    public PropietarioResponse actualizar(
            Long id,
            PropietarioRequest request
    ) {

        PropietarioEntity entity =
                buscarPropietario(id);

        propietarioMapper.updateEntity(
                request,
                entity
        );

        return propietarioMapper.toResponse(
                propietarioRepository.save(entity)
        );
    }

    @Override
    @Transactional
    public void eliminar(Long id) {

        PropietarioEntity entity =
                buscarPropietario(id);

        propietarioRepository.delete(entity);
    }

    private PropietarioEntity buscarPropietario(
            Long id
    ) {

        return propietarioRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Propietario no encontrado"
                        )
                );
    }
}